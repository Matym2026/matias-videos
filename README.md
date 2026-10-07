# matias-videos

Plataforma de videos tipo SPA desarrollada para la materia **Arquitectura en la Nube para Tecnologías de la Información**. Permite registrarse, iniciar sesión, publicar videos, reproducirlos, comentarlos y gestionar los videos propios.

- **Frontend:** React + Vite (compilado y alojado en Amazon S3)
- **Backend:** FastAPI (Python) desplegado en Amazon EC2
- **Base de datos:** PostgreSQL en Amazon RDS
- **Archivos:** videos y miniaturas en dos buckets de Amazon S3

## Arquitectura

```
                  ┌──────────────────────────┐
   Navegador ───▶ │ S3 Frontend (dist/ React)│
        │         └──────────────────────────┘
        │
        │ HTTP (JSON / multipart)
        ▼
┌──────────────────┐   SQL (5432)   ┌──────────────────┐
│  EC2 · FastAPI   │ ─────────────▶ │  RDS PostgreSQL  │
└──────────────────┘                └──────────────────┘
        │ boto3 (IAM Role)
        ▼
┌─────────────────────┐  ┌─────────────────────────┐
│ S3 Videos (.mp4)    │  │ S3 Miniaturas (.jpg/png)│
└─────────────────────┘  └─────────────────────────┘
```

| Servicio | Función |
|---|---|
| S3 (frontend) | Aloja la aplicación React compilada (`dist/`) como sitio web estático |
| S3 (videos) | Almacena los archivos MP4 (máx. 100 MB) |
| S3 (miniaturas) | Almacena las imágenes JPG, JPEG y PNG |
| EC2 | Ejecuta la API FastAPI como servicio `systemd` |
| RDS | Guarda usuarios, videos y comentarios (solo datos estructurados) |

La conexión entre servicios se hace con **variables de entorno**, un **IAM Role** (la EC2 accede a S3 sin llaves) y **Security Groups** (RDS solo acepta conexiones desde la EC2). No hay credenciales en el código.

## Estructura del proyecto

```
matias-videos/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── users.py      # registro, login y perfil
│   │   │   └── videos.py     # videos y comentarios
│   │   ├── auth.py           # contraseñas, tokens JWT y permisos
│   │   ├── config.py         # lectura de variables de entorno
│   │   ├── database.py       # conexión con RDS (SQLAlchemy)
│   │   ├── main.py           # aplicación FastAPI y CORS
│   │   ├── models.py         # tablas: users, videos, comments
│   │   ├── schemas.py        # esquemas de entrada y salida
│   │   └── storage.py        # subida y borrado en S3 (boto3)
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/       # Avatar, VideoCard
    │   ├── pages/            # Auth, Home, Watch, Profile
    │   ├── api.js            # llamadas a la API
    │   ├── App.jsx           # menú y rutas
    │   ├── auth.jsx          # sesión del usuario
    │   ├── main.jsx
    │   └── styles.css
    ├── .env.example
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Páginas de la SPA

1. **Registro / Login:** nombre, correo y contraseña.
2. **Principal:** catálogo con miniatura, título, usuario, vistas y fecha, con buscador.
3. **Reproductor:** video, título, descripción, usuario, vistas, comentarios y videos recomendados.
4. **Perfil:** datos del usuario, cantidad de videos, publicar, editar y eliminar videos.

## Endpoints de la API

La documentación interactiva está en `/docs`.

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/users` | Registrar usuario | No |
| POST | `/login` | Iniciar sesión (devuelve token JWT) | No |
| GET | `/users/{id}` | Datos del usuario y cantidad de videos | No |
| POST | `/videos` | Publicar video y miniatura | Sí |
| GET | `/videos` | Listar videos (`?user_id=` para filtrar) | No |
| GET | `/videos/{id}` | Ver un video (suma una vista) | No |
| GET | `/videos/{id}/related` | Videos recomendados | No |
| PUT | `/videos/{id}` | Actualizar título y descripción | Sí |
| DELETE | `/videos/{id}` | Eliminar video y sus archivos en S3 | Sí |
| POST | `/videos/{id}/comments` | Agregar comentario | Sí |
| GET | `/videos/{id}/comments` | Listar comentarios | No |

## Base de datos

| Tabla | Campos |
|---|---|
| `users` | id, name, email, password_hash, role |
| `videos` | id, title, description, video_url, thumbnail_url, views, created_at, user_id |
| `comments` | id, content, created_at, user_id, video_id |

Las contraseñas se guardan con hash (bcrypt). Las tablas se crean automáticamente al iniciar la API.

## Roles y permisos

| Rol | Permisos |
|---|---|
| `user` | Publicar videos, comentar, y editar o eliminar **solo sus videos** |
| `master` | Editar y eliminar **cualquier video**, además de lo anterior |

El rol se guarda en el campo `role` de la tabla `users`. La función `can_modify` (`backend/app/auth.py`) permite modificar un video si el usuario es su dueño o tiene rol `master`. Para crear un master, se registra la cuenta y luego se ejecuta en la base de datos:

```sql
UPDATE users SET role = 'master' WHERE email = 'correo-del-master@ejemplo.com';
```

Los permisos de **IAM** son otra cosa: se usan únicamente para que la instancia EC2 pueda leer, escribir y borrar archivos en los buckets de videos y miniaturas.

## Variables de entorno

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql+psycopg2://USUARIO:CLAVE@ENDPOINT-RDS:5432/matiasvideos
JWT_SECRET=una-clave-larga-y-aleatoria
AWS_REGION=us-east-1
S3_VIDEOS_BUCKET=nombre-del-bucket-de-videos
S3_THUMBS_BUCKET=nombre-del-bucket-de-miniaturas
CORS_ORIGINS=*
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://IP-PUBLICA-DE-LA-EC2:8000
```

El archivo `.env` real **no se sube al repositorio**; solo se incluyen los `.env.example`.

## Ejecución en local

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # completar con tus datos
uvicorn app.main:app --reload
```

Documentación en `http://localhost:8000/docs`. Para subir archivos a S3 desde tu PC necesitas credenciales de AWS configuradas (`aws configure`).

### Frontend

```bash
cd frontend
cp .env.example .env        # completar VITE_API_URL
npm install
npm run dev
```

Se abre en `http://localhost:5173`.

## Despliegue en AWS

### 1. Buckets S3 (región us-east-1)

Crear tres buckets: frontend, videos y miniaturas. En cada uno se desactiva el bloqueo de acceso público y se agrega una política de lectura pública:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "LecturaPublica",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::NOMBRE-DEL-BUCKET/*"
  }]
}
```

En el bucket del frontend se activa *Static website hosting* con `index.html` como documento de índice y de error.

### 2. RDS

Instancia PostgreSQL con base de datos inicial `matiasvideos`. Su Security Group acepta el puerto 5432 únicamente desde el Security Group de la EC2.

### 3. IAM Role para la EC2

Rol con esta política, asociado a la instancia:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    "Resource": [
      "arn:aws:s3:::BUCKET-VIDEOS/*",
      "arn:aws:s3:::BUCKET-MINIATURAS/*"
    ]
  }]
}
```

### 4. EC2 (API)

Ubuntu con Security Group: SSH (22) solo desde tu IP y TCP 8000 abierto.

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip git
git clone https://github.com/Matym2026/matias-videos.git
cd matias-videos/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
nano .env                   # crear con las variables del backend
```

Para que la API quede corriendo como servicio, crear `/etc/systemd/system/matias-api.service`:

```ini
[Unit]
Description=Matias Videos API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/matias-videos/backend
ExecStart=/home/ubuntu/matias-videos/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now matias-api
```

### 5. Frontend en S3

```bash
cd frontend
npm install
npm run build
```

Se sube a S3 **solo el contenido de `dist/`** (`index.html` y `assets/`). No se suben `src/`, `node_modules/` ni `package.json`. La variable `VITE_API_URL` se incorpora al compilar, por lo que debe estar correcta antes de ejecutar `npm run build`.

## Seguridad

- Sin credenciales en el código: variables de entorno e IAM Role.
- Contraseñas con hash bcrypt y sesiones con token JWT.
- Validación de formato (MP4, JPG, JPEG, PNG) y tamaño de archivo (video máx. 100 MB).
- RDS accesible solo desde la EC2.

## Evidencias de la entrega

- URL pública de la SPA: _(completar)_
- URL de la API: _(completar)_ `/docs`
- Capturas de EC2, RDS y los tres buckets S3.
- Capturas de registro, login, catálogo, reproducción, comentarios, recomendados, perfil y publicación.
- Video explicativo: _(completar)_

> Los recursos de AWS fueron eliminados después de la entrega para evitar costos, por lo que las URLs ya no están activas.

## Autor

**Matías** · Arquitectura en la Nube para Tecnologías de la Información
