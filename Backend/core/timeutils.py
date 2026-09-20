"""
Date handling for a platform that runs in India.

Timestamps are stored in UTC everywhere. *Calendar* dates are not: a queue
date, an appointment date and a follow-up due date all mean "the day as it is
in Prayagraj", not "the day as it is in UTC".

Those two differ for 5.5 hours of every day. Between 18:30 IST and midnight,
`datetime.now(timezone.utc).date()` is already yesterday from the user's point
of view, which is how a facility dashboard ends up reporting an empty queue
during evening OPD hours. Every module that touches a calendar date goes
through this helper so the whole backend agrees on what "today" means.
"""

from datetime import date, datetime
from zoneinfo import ZoneInfo

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


def now_ist() -> datetime:
    """Current moment, expressed in India Standard Time."""
    return datetime.now(INDIA_TIMEZONE)


def today_ist() -> date:
    """Today's calendar date in India Standard Time."""
    return now_ist().date()


def today_ist_str() -> str:
    """Today's date in India Standard Time as `YYYY-MM-DD`."""
    return today_ist().isoformat()
