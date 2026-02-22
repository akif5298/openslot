#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="$ROOT_DIR/docs/milestone-02"
SCHEMA_FILE="$ROOT_DIR/db/schema.sql"
SERVER_DIR="$ROOT_DIR/server"
TEST_PORT="${TEST_PORT:-3051}"
BASE_URL="http://localhost:${TEST_PORT}"

TMP_DIR="$(mktemp -d)"
TMP_DB="$TMP_DIR/openslot_m2.sqlite"
SERVER_LOG="$TMP_DIR/server.log"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pass() {
  printf '[PASS] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1"
  exit 1
}

require_file() {
  local file="$1"
  [[ -f "$file" ]] || fail "Missing required file: $file"
}

assert_json_value() {
  local json_file="$1"
  local py_expr="$2"
  local label="$3"

  python3 - "$json_file" "$py_expr" "$label" <<'PY'
import json
import sys

json_file, expression, label = sys.argv[1], sys.argv[2], sys.argv[3]
with open(json_file, 'r', encoding='utf-8') as f:
    payload = json.load(f)

if not eval(expression, {'payload': payload}):
    raise SystemExit(f"JSON assertion failed: {label}")
PY
}

echo "Running OpenSlot Milestone 02 verification..."

# 1) Artifact presence checks
require_file "$ROOT_DIR/README.md"
require_file "$ROOT_DIR/client/login.html"
require_file "$ROOT_DIR/client/student-dashboard.html"
require_file "$ROOT_DIR/client/professor-dashboard.html"
require_file "$ROOT_DIR/client/my-bookings.html"
require_file "$ROOT_DIR/client/professor-schedule.html"
require_file "$ROOT_DIR/client/slot-create.html"
require_file "$ROOT_DIR/client/appointment-details.html"

require_file "$DOCS_DIR/database-design-package.pdf"
require_file "$DOCS_DIR/database-design-package.txt"
require_file "$DOCS_DIR/database-design.md"
require_file "$DOCS_DIR/activity-blog.md"
require_file "$DOCS_DIR/kanban-evidence.md"
pass "Milestone 02 artifact files present"

# 2) JavaScript syntax checks
while IFS= read -r -d '' js_file; do
  node --check "$js_file" >/dev/null || fail "Syntax check failed for $js_file"
done < <(find "$ROOT_DIR/client/js" "$ROOT_DIR/server/src" -name '*.js' -print0)
pass "Client/server JavaScript syntax checks passed"

# 3) SQL schema checks
sqlite3 "$TMP_DB" < "$SCHEMA_FILE"
pass "Schema executes cleanly in sqlite"

sqlite3 "$TMP_DB" <<'SQL'
PRAGMA foreign_keys = ON;
INSERT INTO users (user_id, name, email, role) VALUES
  (1, 'Student One', 'student.one@demo.com', 'student'),
  (101, 'Professor One', 'prof.one@demo.com', 'professor');
INSERT INTO courses (course_id, course_code, course_name, term)
VALUES (476, 'CP476', 'Internet Computing', 'Winter 2026');
INSERT INTO office_hour_slots (
  slot_id, professor_id, course_id, start_time, end_time, mode, visibility, status
) VALUES (
  1001, 101, 476, '2026-03-01 10:00:00', '2026-03-01 10:30:00', 'virtual', 'public', 'posted'
);
INSERT INTO appointments (appointment_id, slot_id, student_id, status)
VALUES (5001, 1001, 1, 'booked');
SQL
pass "Schema supports valid relational inserts"

if sqlite3 "$TMP_DB" "INSERT INTO users (user_id, name, email, role) VALUES (2, 'Bad', 'bad@demo.com', 'admin');" >/dev/null 2>&1; then
  fail "Role CHECK constraint did not reject invalid role"
fi
pass "Role CHECK constraint enforced"

# 4) API smoke test (server start + key flows)
cd "$SERVER_DIR"
PORT="$TEST_PORT" node src/app.js > "$SERVER_LOG" 2>&1 &
SERVER_PID="$!"
cd "$ROOT_DIR"

# Wait for server startup.
for _ in {1..25}; do
  if curl -sSf "${BASE_URL}/" > "$TMP_DIR/root.json" 2>/dev/null; then
    break
  fi
  sleep 0.2
done

[[ -f "$TMP_DIR/root.json" ]] || fail "Server did not become ready"
assert_json_value "$TMP_DIR/root.json" "payload.get('ok') is True" "root ok"
assert_json_value "$TMP_DIR/root.json" "payload.get('milestone') == 2" "root milestone marker"
pass "Server boots and health endpoint responds"

# Login and core API checks
curl -sSf -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@demo.com"}' > "$TMP_DIR/student_login.json"
assert_json_value "$TMP_DIR/student_login.json" "payload.get('ok') is True and payload.get('user', {}).get('role') == 'student'" "student login"

curl -sSf -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"prof@demo.com"}' > "$TMP_DIR/prof_login.json"
assert_json_value "$TMP_DIR/prof_login.json" "payload.get('ok') is True and payload.get('user', {}).get('role') == 'professor'" "prof login"

curl -sSf "${BASE_URL}/api/courses" > "$TMP_DIR/courses.json"
assert_json_value "$TMP_DIR/courses.json" "payload.get('ok') is True and len(payload.get('courses', [])) >= 1" "courses list"

# Create -> post -> book -> reschedule -> cancel
curl -sSf -X POST "${BASE_URL}/api/slots" \
  -H "Content-Type: application/json" \
  -d '{"professor_id":101,"course_id":476,"start_time":"2099-02-03T10:00:00","end_time":"2099-02-03T10:30:00","mode":"virtual","location_or_link":"https://meet.example/slot-a","visibility":"public","status":"posted"}' > "$TMP_DIR/slot_a.json"

curl -sSf -X POST "${BASE_URL}/api/slots" \
  -H "Content-Type: application/json" \
  -d '{"professor_id":101,"course_id":476,"start_time":"2099-02-03T11:00:00","end_time":"2099-02-03T11:30:00","mode":"in_person","location_or_link":"LH3008","visibility":"public","status":"posted"}' > "$TMP_DIR/slot_b.json"

SLOT_A_ID="$(python3 -c "import json;print(json.load(open('$TMP_DIR/slot_a.json'))['slot']['slot_id'])")"
SLOT_B_ID="$(python3 -c "import json;print(json.load(open('$TMP_DIR/slot_b.json'))['slot']['slot_id'])")"

curl -sSf -X POST "${BASE_URL}/api/appointments" \
  -H "Content-Type: application/json" \
  -d "{\"slot_id\":$SLOT_A_ID,\"student_id\":1,\"notes\":\"Smoke test booking\"}" > "$TMP_DIR/book.json"

APPT_ID="$(python3 -c "import json;print(json.load(open('$TMP_DIR/book.json'))['appointment']['appointment_id'])")"

curl -sSf -X PATCH "${BASE_URL}/api/appointments/$APPT_ID/reschedule" \
  -H "Content-Type: application/json" \
  -d "{\"new_slot_id\":$SLOT_B_ID}" > "$TMP_DIR/reschedule.json"
assert_json_value "$TMP_DIR/reschedule.json" "payload.get('ok') is True and payload.get('new_slot', {}).get('slot_id') == int('$SLOT_B_ID')" "reschedule"

curl -sSf -X PATCH "${BASE_URL}/api/appointments/$APPT_ID/cancel" > "$TMP_DIR/cancel.json"
assert_json_value "$TMP_DIR/cancel.json" "payload.get('ok') is True and payload.get('appointment', {}).get('status') == 'cancelled'" "cancel"

curl -sSf "${BASE_URL}/api/schedule/professor/101?view=week&date=2099-02-03" > "$TMP_DIR/schedule.json"
assert_json_value "$TMP_DIR/schedule.json" "payload.get('ok') is True and payload.get('view') == 'week'" "schedule"
pass "API smoke tests passed (login/courses/slots/booking/reschedule/cancel/schedule)"

echo "Milestone 02 verification complete: PASS"
