import pytest

from ...models import *  # pylint: disable=wildcard-import
from ..helpers import *  # pylint: disable=wildcard-import


@pytest.fixture
def election_id(client: FlaskClient, org_id: str, request):
    set_logged_in_user(client, UserType.AUDIT_ADMIN, DEFAULT_AA_EMAIL)
    return create_election(
        client,
        audit_name=f"Test Audit {request.node.name}",
        audit_type=AuditType.HYBRID,
        audit_math_type=AuditMathType.SUITE,
        organization_id=org_id,
    )