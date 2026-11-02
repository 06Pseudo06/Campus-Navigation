from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# PostgreSQL naming conventions matching Neon database constraint and index names
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """
    SQLAlchemy 2.x Declarative Base for CampusWay.
    All ORM models inherit from this base class.
    Configured with standard metadata naming conventions matching Neon PostgreSQL.
    """
    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)
