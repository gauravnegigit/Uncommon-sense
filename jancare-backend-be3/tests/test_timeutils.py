"""
Regression tests for the IST/UTC split.

Calendar dates in JanCare mean "the day as it is in India". Between 18:30 IST
and midnight the UTC date is still yesterday, which used to make the facility
dashboard read an empty queue during evening OPD. Every module that compares
calendar dates must go through core.timeutils.
"""

from datetime import datetime, timezone

from core.timeutils import INDIA_TIMEZONE, today_ist, today_ist_str
from api.appointments import _today_str
from api.followups import _display_status


def test_today_is_the_indian_calendar_date():
    expected = datetime.now(INDIA_TIMEZONE).date()

    assert today_ist() == expected
    assert today_ist_str() == expected.isoformat()


def test_queue_dates_and_dashboard_agree():
    """
    The dashboard filters queue entries by the same string the queue writes.
    If these ever diverge the evening queue silently reads as empty.
    """
    assert _today_str() == today_ist_str()


def test_followup_due_today_is_due_not_overdue():
    doc = {
        "status": "OPEN",
        "due_date": today_ist().isoformat(),
    }
    assert _display_status(doc) == "DUE"


def test_utc_evening_does_not_shift_the_day():
    """
    A follow-up due today must never read OVERDUE just because the server's
    UTC clock has not yet rolled over.
    """
    ist_today = datetime.now(INDIA_TIMEZONE).date()
    utc_today = datetime.now(timezone.utc).date()

    doc = {"status": "OPEN", "due_date": ist_today.isoformat()}

    # Whatever the relationship between the two clocks right now, the
    # displayed status follows the Indian date.
    assert _display_status(doc) == "DUE"

    if ist_today != utc_today:
        # We are inside the 18:30-midnight IST window that used to break.
        assert _display_status(
            {"status": "OPEN", "due_date": utc_today.isoformat()}
        ) == "OVERDUE"
