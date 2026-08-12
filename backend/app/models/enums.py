"""
Centralised enums so status values can't drift into typos across the codebase
(e.g. "Scheduled" vs "scheduled" vs "SCHEDULED" causing silent bugs).
"""

import enum


class ShiftStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VisitStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"


class NoteType(str, enum.Enum):
    DURING_VISIT = "during_visit"
    END_SUMMARY = "end_summary"


class WorkerResponseStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class CareRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
