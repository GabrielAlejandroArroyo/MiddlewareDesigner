"""
Generador de IDs para entidades del ecosistema.
Formato: TTTT_YYMMDDHHMMSSFFFF (4 chars tipo + _ + 16 chars timestamp).
"""
from datetime import datetime

ENTITY_TYPES = {"APLI", "ROLE", "USUA", "APRL", "USRO", "CORP", "EMPR", "PAIS", "PROV", "LOCA"}


def generate_entity_id(tipo: str) -> str:
    """
    Genera ID en formato TTTT_YYMMDDHHMMSSFFFF.
    tipo: código de 4 letras (APLI, ROLE, USUA, etc.).
    """
    tipo_upper = tipo.upper()
    if tipo_upper not in ENTITY_TYPES:
        raise ValueError(f"Tipo inválido. Use uno de: {ENTITY_TYPES}")
    now = datetime.utcnow()
    ts = (
        f"{now.strftime('%y')}"  # YY
        f"{now.strftime('%m')}"  # MM
        f"{now.strftime('%d')}"  # DD
        f"{now.strftime('%H')}"  # HH
        f"{now.strftime('%M')}"  # MM
        f"{now.strftime('%S')}"  # SS
        f"{now.microsecond // 100:04d}"  # FFFF
    )
    return f"{tipo_upper}_{ts}"


def is_valid_entity_id(value: str) -> bool:
    """Valida que un ID cumpla el formato TTTT_YYMMDDHHMMSSFFFF."""
    if not value or len(value) != 21:
        return False
    if value[4] != "_":
        return False
    tipo = value[:4]
    ts = value[5:]
    return tipo in ENTITY_TYPES and ts.isdigit() and len(ts) == 16
