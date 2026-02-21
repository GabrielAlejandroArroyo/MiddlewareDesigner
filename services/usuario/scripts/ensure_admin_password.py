"""
Asegura que el admin tenga una contraseña que verifique correctamente.
Si el hash existente no verifica con "admin", lo reemplaza.
Útil para corregir BDs con hashes corruptos o incompatibles.
"""
from config.database import AsyncSessionLocal
from entity.usuario_model import UsuarioModel
from sqlalchemy import select


async def ensure_admin_password_valid_async():
    from passlib.context import CryptContext
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(UsuarioModel).where(UsuarioModel.nombre_usuario == "admin"))
            admin = result.scalar_one_or_none()
            if not admin or not admin.password_hash:
                return
            try:
                if ctx.verify("admin", admin.password_hash):
                    return  # Hash válido, no hacer nada
            except Exception:
                pass
            # Hash inválido: reasignar contraseña admin y marcar cambio obligatorio
            admin.password_hash = ctx.hash("admin")
            admin.requiere_cambio_password = True
            await session.commit()
            print("  Admin: contraseña corregida (admin/admin, debe cambiarla en primer login)")
    except Exception as e:
        print(f"  [WARN] No se pudo verificar/corregir admin: {e}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(ensure_admin_password_valid_async())
