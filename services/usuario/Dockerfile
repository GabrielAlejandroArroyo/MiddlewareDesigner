FROM python:3.12-slim

WORKDIR /app

# Copiar e instalar dependencias
COPY services/usuario/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar módulo compartido (id_generator) y código del servicio
COPY shared/ ./shared/
COPY services/usuario/ ./

# PYTHONPATH para importar shared desde la raíz
ENV PYTHONPATH=/app

EXPOSE 8007

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8007"]
