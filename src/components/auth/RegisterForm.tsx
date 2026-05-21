"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

type RegisterFormProps = {
  onSuccess?: (user: { id: number; email: string; name?: string }) => void;
};

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }

      setSuccess("¡Registro exitoso! Redirigiendo...");
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      if (onSuccess && data.user) {
        setTimeout(() => {
          onSuccess(data.user);
        }, 1000);
      }
    } catch (err) {
      setError("Error de conexión al servidor");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      <Input
        type="text"
        placeholder="Nombre completo"
        name="name"
        value={formData.name}
        onChange={handleChange}
      />

      <Input
        type="email"
        placeholder="Correo electrónico"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <Input
        type="password"
        placeholder="Contraseña"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <Input
        type="password"
        placeholder="Confirmar contraseña"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />

      <Button
        variant="primary"
        size="md"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Registrando..." : "Registrarse"}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className="font-semibold text-blue-light-700 hover:text-blue-light-600 dark:text-blue-light-300">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
