# Noema release operations

This context names the authority boundaries for reviewing and landing Noema runtime changes. It is separate from the world's Player and consequence language.

## Language

**Review readiness** — a declaration that a candidate is available for independent review; it carries no provisioning, deployment or acceptance authority.
_Avoid_: resource approval, deployment readiness

**Preview authorization** — a separate, explicitly bounded grant to create a preview environment.
_Avoid_: implicit preview permission

**Readiness assurance** — the evidence-supported judgment that a review-state transition fits Noema's approved resource boundary; it is distinct from an absolute provider guarantee or acceptance of the product.
_Avoid_: provisioning permission, whole-product acceptance

**Merge eligibility** — the state in which the candidate has satisfied its required checks and eligible independent approval.
_Avoid_: implementation approval, CI approval

**Automatic landing** — execution of an eligible merge under the agreed standing workflow without another manual scheduling step.
_Avoid_: automatic approval, administrative bypass
