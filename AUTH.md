# Sistema de Autenticación con Neon y Prisma

## Descripción

Sistema de registro e inicio de sesión integrado con base de datos PostgreSQL en Neon usando Prisma ORM.

## Configuración

### Variables de Entorno

El archivo `.env` ya contiene la cadena de conexión a Neon:

```env
DATABASE_URL="postgresql://usuario:password@host-de-neon.aws.neon.tech/neondb?sslmode=require"
```

## API Endpoints

### Registro de Usuario

**POST** `/api/auth/register`

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "miContraseña123",
  "confirmPassword": "miContraseña123"
}
```

**Response (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Pérez"
  }
}
```

**Errores (400, 500):**
```json
{
  "error": "Descripción del error"
}
```

### Login de Usuario

**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "miContraseña123"
}
```

**Response (200):**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Pérez"
  }
}
```

## Componentes

### RegisterForm
Componente de registro con validación de formulario.

```tsx
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div>
      <h1>Registrarse</h1>
      <RegisterForm />
    </div>
  );
}
```

### SignInForm
Componente de login actualizado con integración de API.

## Base de Datos

### Esquema

Tabla `users`:
- `id`: Identificador único (autoincremento)
- `email`: Email único del usuario
- `name`: Nombre del usuario (opcional)
- `password`: Contraseña encriptada
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de actualización

### Migraciones

Las migraciones están en la carpeta `prisma/migrations/`.

Para ejecutar migraciones:
```bash
npx prisma migrate dev
```

## Seguridad

- Las contraseñas se encriptan con bcryptjs (10 rondas)
- Se valida que las contraseñas coincidan en el registro
- Mínimo 6 caracteres para contraseñas
- Emails únicos en la base de datos

## Próximos Pasos

1. Implementar JWT o sesiones para mantener usuarios logueados
2. Agregar confirmación de email
3. Implementar "Olvidé mi contraseña"
4. Agregar roles y permisos
5. Implementar 2FA (Autenticación de dos factores)
