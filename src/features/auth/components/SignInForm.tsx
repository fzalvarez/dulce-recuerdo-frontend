import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signInSchema, type SignInSchema } from "../validation/signIn.schema";
import { useAuthStore } from "../store/auth.store";
import { iniciarSesion, usuarioActual } from "../api";
import { getApiErrorMessage } from "@/shared/lib/http-error";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const setSesion = useAuthStore((s) => s.setSesion);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: { rememberMe: false },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: SignInSchema) => {
    setErrorLogin(null);
    try {
      const token = await iniciarSesion(data.email, data.password);
      const yo = await usuarioActual(token);
      setSesion(token, yo.modulos);
      navigate("/");
    } catch (e) {
      setErrorLogin(getApiErrorMessage(e, "No se pudo iniciar sesión."));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="nombre@dulcerecuerdo.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pr-10"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Remember me + forgot password */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) =>
              setValue("rememberMe", checked === true)
            }
          />
          <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
            Recordarme en este equipo
          </span>
        </label>
        <a
          href="#"
          className="text-xs font-medium text-brand-500 hover:underline transition-all"
        >
          ¿Olvidó su contraseña?
        </a>
      </div>

      {errorLogin && (
        <p role="alert" className="text-sm text-red-600">
          {errorLogin}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11 mt-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoaderIcon className="size-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  );
}
