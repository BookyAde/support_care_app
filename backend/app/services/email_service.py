"""
Handles the "system auto-generates credentials and emails them automatically"
requirement you and Olajide agreed on. Using Resend here as the transactional
email provider - swap this out for SendGrid/Postmark by changing only this file,
since every other part of the app calls `send_worker_credentials_email()` and
doesn't care how the email actually gets sent.

IMPORTANT: this fails SAFELY - if the email API is down or the key is missing,
we log it and return False rather than raising, because a failed email should
never block the admin from having successfully created the worker account. The
route returns the temporary password in the response either way, precisely so
the admin can relay it manually if this fails.

Every email below is built from build_branded_email_html() - one shared,
inline-styled, table-based template (see the big comment above that function
for why it's built the way it is), so every email this app sends looks like
it came from the same product instead of a patchwork of ad-hoc <p> tags.
"""

import logging

import resend

from app.config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY

# Design tokens, lifted straight from admin-app/src/app/globals.css, so the
# emails read as the same product as the app itself rather than inventing a
# separate palette. Email clients can't read CSS custom properties, so these
# get inlined as plain hex wherever they're used below.
_INK = "#16201D"
_PAPER = "#E9E6DA"
_PAPER_RAISED = "#F5F2E8"
_TEAL = "#0B6B72"
_TEAL_DEEP = "#08494E"
_BRICK = "#C23B2E"
_BRICK_TINT = "#FBEAE8"  # a light wash of _BRICK, safe as a solid email-client background

# Real web fonts can't be trusted in email (most clients strip @font-face
# entirely), so these are the same *fallback* stacks already used in
# globals.css for --font-display/--font-body - the email ends up looking
# like the app's fallback rendering, not a mismatched font choice.
_FONT_DISPLAY = "Georgia, 'Times New Roman', serif"
_FONT_BODY = "Calibri, Candara, 'Segoe UI', Helvetica, Arial, sans-serif"


def build_branded_email_html(
    preheader: str,
    heading: str,
    body_paragraphs: list[str],
    cta_label: str | None,
    cta_url: str | None,
    footer_note: str | None = None,
) -> str:
    """
    One shared template for every transactional email this app sends.

    Table-based layout, fully inline styles, no <style> block and no
    flexbox/grid - the only layout approach that survives Outlook/Gmail's
    aggressive CSS stripping and the inconsistent rendering engines across
    mobile mail clients. Single column, ~480px max width, centered - the
    safest responsive pattern for email (it just naturally fits narrow
    screens rather than needing real media queries, which many clients
    ignore anyway).

    `body_paragraphs` are raw HTML strings, not plain text - callers can drop
    in a styled credentials block or a highlighted reason box as one of the
    "paragraphs" alongside plain <p> text, without this template needing to
    know anything about credentials or decline reasons specifically.
    """
    preheader_html = f"""
        <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
            {preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        </div>
    """

    body_html = "".join(
        f'<tr><td style="padding:0 0 18px 0;">{paragraph}</td></tr>' for paragraph in body_paragraphs
    )

    cta_html = ""
    if cta_label and cta_url:
        cta_html = f"""
        <tr>
            <td style="padding:8px 0 6px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="border-radius:6px;background-color:{_TEAL};">
                            <a href="{cta_url}"
                               style="display:inline-block;padding:13px 28px;font-family:{_FONT_BODY};
                                      font-size:14px;font-weight:bold;color:#FFFFFF;text-decoration:none;
                                      border-radius:6px;">
                                {cta_label}
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        """

    footer_html = ""
    if footer_note:
        footer_html = f"""
        <tr>
            <td style="padding:22px 32px 0 32px;text-align:center;">
                <p style="margin:0;font-family:{_FONT_BODY};font-size:11.5px;line-height:1.5;color:#8A9088;">
                    {footer_note}
                </p>
            </td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{heading}</title>
</head>
<body style="margin:0;padding:0;background-color:{_PAPER};">
    {preheader_html}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{_PAPER};">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0"
                       style="width:480px;max-width:100%;background-color:{_PAPER_RAISED};border-radius:10px;overflow:hidden;">
                    <tr>
                        <td style="background-color:{_INK};padding:26px 32px;">
                            <span style="font-family:{_FONT_DISPLAY};font-size:19px;font-weight:bold;color:{_PAPER_RAISED};letter-spacing:0.2px;">
                                Bountiful Support Plus
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 32px 8px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:0 0 16px 0;">
                                        <h1 style="margin:0;font-family:{_FONT_DISPLAY};font-size:23px;line-height:1.3;color:{_INK};font-weight:bold;">
                                            {heading}
                                        </h1>
                                    </td>
                                </tr>
                                {body_html}
                                {cta_html}
                            </table>
                        </td>
                    </tr>
                    {footer_html}
                    <tr>
                        <td style="padding:20px 32px 28px 32px;text-align:center;">
                            <p style="margin:0;font-family:{_FONT_BODY};font-size:11px;color:#A3A99C;">
                                &copy; 2026 Bountiful Support Plus Limited
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


def _credentials_block_html(rows: list[tuple[str, str]]) -> str:
    """
    The email equivalent of the dark credential panel already used across
    admin-app (workers/new, clients/new, CredentialsModal, etc.) - same ink
    background, same monospace treatment for the actual values, so a temp
    password looks like the same kind of thing whether you're looking at it
    in the app or in your inbox.
    """
    rows_html = "".join(
        f"""
        <div style="{"margin-top:14px;" if i > 0 else ""}">
            <p style="margin:0 0 3px 0;font-family:{_FONT_BODY};font-size:11.5px;color:#B9BFB2;">{label}</p>
            <p style="margin:0;font-family:'SF Mono',Consolas,'Courier New',monospace;font-size:17px;color:{_PAPER_RAISED};font-weight:bold;">{value}</p>
        </div>
        """
        for i, (label, value) in enumerate(rows)
    )
    return f"""
    <div style="background-color:{_INK};border-radius:8px;padding:18px 20px;">
        {rows_html}
    </div>
    """


def send_worker_credentials_email(
    to_email: str,
    full_name: str,
    employee_id: str,
    temporary_password: str,
) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - skipping credentials email send.")
        return False

    try:
        html = build_branded_email_html(
            preheader=f"Your Employee ID and temporary password are ready, {full_name.split(' ')[0]}.",
            heading="Welcome to the team",
            body_paragraphs=[
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14.5px;line-height:1.6;color:{_INK};'>Hi {full_name},</p>",
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14.5px;line-height:1.6;color:{_INK};'>"
                f"You've officially been added as a Support Worker with Bountiful Support Plus. "
                f"Here are your login details:</p>",
                _credentials_block_html(
                    [("Employee ID", employee_id), ("Temporary Password", temporary_password)]
                ),
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:13.5px;line-height:1.6;color:#5C6259;'>"
                f"You'll be asked to set a new password the first time you sign in.</p>",
            ],
            cta_label="Sign in to your dashboard",
            cta_url=f"{settings.WORKER_APP_URL}/login",
            footer_note="The Bountiful Support Plus team is here if you need anything.",
        )
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [to_email],
                "subject": "Welcome to the team - your login details",
                "html": html,
            }
        )
        return True
    except Exception:
        logger.exception("Failed to send worker credentials email to %s", to_email)
        return False


def send_admin_credentials_email(
    to_email: str,
    full_name: str,
    temporary_password: str,
) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - skipping credentials email send.")
        return False

    try:
        html = build_branded_email_html(
            preheader=f"Your admin account is set up, {full_name.split(' ')[0]}.",
            heading="You've been added as an admin",
            body_paragraphs=[
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14.5px;line-height:1.6;color:{_INK};'>Hi {full_name},</p>",
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14.5px;line-height:1.6;color:{_INK};'>"
                f"You've been given admin access to Bountiful Support Plus's management portal - scheduling visits, "
                f"managing clients and workers, and pulling reports. Here are your login details:</p>",
                _credentials_block_html([("Email", to_email), ("Temporary Password", temporary_password)]),
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:13.5px;line-height:1.6;color:#5C6259;'>"
                f"You'll be asked to set a new password the first time you sign in.</p>",
            ],
            cta_label="Sign in to the admin portal",
            cta_url=f"{settings.ADMIN_APP_URL}/login",
            footer_note="The Bountiful Support Plus team is here if you need anything.",
        )
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [to_email],
                "subject": "You've been added as an admin - your login details",
                "html": html,
            }
        )
        return True
    except Exception:
        logger.exception("Failed to send admin credentials email to %s", to_email)
        return False


def send_client_credentials_email(
    to_email: str,
    full_name: str,
    access_code: str,
    temporary_password: str,
    accepted_from_care_request: bool = False,
) -> bool:
    """
    `accepted_from_care_request` distinguishes two very different moments for
    the person reading this: one is "someone reviewed the request I sent in
    and said yes", the other is just "an account was set up for me" with no
    prior request in the picture (an admin added them directly). Same
    credentials, same CTA - the opening copy and heading are what actually
    need to be honest about which one this is.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - skipping credentials email send.")
        return False

    try:
        if accepted_from_care_request:
            heading = "Your care request has been accepted"
            opening = (
                f"Hi {full_name}, great news - we've reviewed the care request submitted for you and "
                f"it's been approved. We're looking forward to supporting you. Here are your login details:"
            )
        else:
            heading = "Your account is ready"
            opening = (
                f"Hi {full_name}, an account has been set up for you with Bountiful Support Plus. "
                f"Here are your login details:"
            )

        html = build_branded_email_html(
            preheader="Your login details are ready.",
            heading=heading,
            body_paragraphs=[
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14.5px;line-height:1.6;color:{_INK};'>{opening}</p>",
                _credentials_block_html(
                    [("Access Code", access_code), ("Temporary Password", temporary_password)]
                ),
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:13.5px;line-height:1.6;color:#5C6259;'>"
                f"You'll be asked to set a new password the first time you sign in.</p>",
            ],
            cta_label="Sign in to your account",
            cta_url=f"{settings.CLIENT_APP_URL}/login",
            footer_note="We're glad to have you with us - the team is here if you need anything.",
        )
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [to_email],
                "subject": (
                    "Your care request has been accepted - your login details"
                    if accepted_from_care_request
                    else "Your account is ready - your login details"
                ),
                "html": html,
            }
        )
        return True
    except Exception:
        logger.exception("Failed to send client credentials email to %s", to_email)
        return False


def send_care_request_declined_email(
    to_email: str,
    requester_name: str,
    reason: str,
) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - skipping care request declined email send.")
        return False

    try:
        reason_block = f"""
        <div style="background-color:{_BRICK_TINT};border-left:4px solid {_BRICK};border-radius:0 6px 6px 0;padding:14px 16px;">
            <p style="margin:0;font-family:{_FONT_BODY};font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.4px;color:{_BRICK};">Reason</p>
            <p style="margin:4px 0 0 0;font-family:{_FONT_BODY};font-size:14px;line-height:1.55;color:{_INK};">{reason}</p>
        </div>
        """

        html = build_branded_email_html(
            preheader="An update on the care request you submitted.",
            heading="About your care request",
            body_paragraphs=[
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14.5px;line-height:1.6;color:{_INK};'>Hi {requester_name},</p>",
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14.5px;line-height:1.6;color:{_INK};'>"
                f"Thank you for reaching out to us about care. We've reviewed your request carefully, and "
                f"unfortunately we're not able to take it forward at this time.</p>",
                reason_block,
                f"<p style='margin:0;font-family:{_FONT_BODY};font-size:14px;line-height:1.6;color:{_INK};'>"
                f"If anything about your situation changes, or you'd just like to talk it through, please don't "
                f"hesitate to reach out to us again - we'd be glad to take another look.</p>",
            ],
            cta_label=None,
            cta_url=None,
            footer_note="This is an automated message from Bountiful Support Plus.",
        )
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [to_email],
                "subject": "About your care request",
                "html": html,
            }
        )
        return True
    except Exception:
        logger.exception("Failed to send care request declined email to %s", to_email)
        return False


def send_contact_message_email(
    visitor_name: str,
    visitor_email: str,
    message: str,
) -> bool:
    """Public marketing-site contact form -> settings.SUPPORT_EMAIL_ADDRESS.
    reply_to is set to the visitor's own address so support can hit reply and
    land straight in the visitor's inbox, no copy-pasting their email out of
    the body first. Internal-facing (goes to the support team, not a
    customer/teammate) so it deliberately stays a plain notification rather
    than the branded template."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - skipping contact message email send.")
        return False

    try:
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": [settings.SUPPORT_EMAIL_ADDRESS],
                "reply_to": visitor_email,
                "subject": f"New contact form message from {visitor_name}",
                "html": f"""
                    <p><strong>Name:</strong> {visitor_name}<br/>
                    <strong>Email:</strong> {visitor_email}</p>
                    <p><strong>Message:</strong><br/>{message}</p>
                """,
            }
        )
        return True
    except Exception:
        logger.exception("Failed to send contact message email from %s", visitor_email)
        return False


def send_flagged_event_email(to_email: str, subject: str, body_html: str) -> bool:
    """Placeholder for the future AI-monitoring notification feature we discussed -
    same pattern, different template, reused when we build that piece later."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set - skipping flagged event email send.")
        return False
    try:
        resend.Emails.send(
            {"from": settings.EMAIL_FROM_ADDRESS, "to": [to_email], "subject": subject, "html": body_html}
        )
        return True
    except Exception:
        logger.exception("Failed to send flagged event email to %s", to_email)
        return False
