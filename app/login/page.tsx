"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingTestUser, setIsCreatingTestUser] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Función para crear un usuario administrador de prueba
  async function createTestAdminUser() {
    try {
      setIsCreatingTestUser(true);
      
      // Importar las funciones de Firebase
      const { signUp, db, ADMIN_ROLE } = await import('@/app/firebaseConfig');
      const { doc, setDoc } = await import('firebase/firestore');
      
      // Credenciales de prueba
      const testEmail = "admin@test.com";
      const testPassword = "password123";
      
      // Registrar usuario con Firebase Auth
      const userCredential = await signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (!userCredential) {
        throw new Error("No se pudo crear la cuenta de prueba");
      }
      
      // Obtener el usuario de Firebase
      const firebaseUser = userCredential.user;
      
      // Crear documento del usuario en Firestore con rol de administrador
      await setDoc(doc(db, "users", firebaseUser.uid), {
        name: "Administrador de Prueba",
        email: testEmail,
        role: ADMIN_ROLE, // Usar el rol de administrador definido en firebaseConfig
        companies: [],
        createdAt: new Date().toISOString()
      });
      
      // Rellenar automáticamente el formulario con las credenciales de prueba
      form.setValue("email", testEmail);
      form.setValue("password", testPassword);
      
      toast({
        title: "Usuario creado",
        description: `Se ha creado un usuario administrador de prueba con email: ${testEmail} y contraseña: ${testPassword}`,
      });
      
    } catch (error) {
      console.error("Error al crear usuario de prueba:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el usuario de prueba. Es posible que ya exista.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTestUser(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      // Importar las funciones de Firebase
      const { onSigIn, ADMIN_ROLE } = await import('@/app/firebaseConfig');
      const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');

      console.log("Logging in with:", values);

      // Iniciar sesión con Firebase
      const userCredential = await onSigIn({
        email: values.email,
        password: values.password
      });

      if (!userCredential) {
        throw new Error("No se pudo iniciar sesión");
      }

      // Obtener el usuario de Firebase
      const firebaseUser = userCredential.user;
      
      // Buscar el documento del usuario en Firestore para obtener su rol
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", firebaseUser.email));
      const querySnapshot = await getDocs(q);
      
      // Lista de emails que siempre serán administradores
      const adminEmails = ["admin@test.com", "fe.rv@hotmail.com"];
      
      let userRole = "employee"; // Rol por defecto
      let userDocument = null;
      
      // MÉTODO 1: Si el email está en la lista de administradores, asignar rol de administrador directamente
      // Esto garantiza que los emails específicos siempre tengan acceso de administrador
      if (adminEmails.includes(firebaseUser.email)) {
        userRole = ADMIN_ROLE; // Asignar el rol "DhHkVja"
        console.log("Email en lista de administradores. Asignando rol de administrador directamente.");
      } 
      // MÉTODO 2: Si el email no está en la lista, verificar en Firestore si tiene rol de administrador
      // Esto permite asignar rol de administrador a usuarios desde la base de datos
      else if (!querySnapshot.empty) {
        userDocument = querySnapshot.docs[0].data();
        
        // Obtener el rol del documento en Firestore
        let rawRole = userDocument.role || "employee";
        
        // Limpiar el valor del rol (eliminar comillas adicionales si existen)
        // Esto permite que "DhHkVja" y '"DhHkVja"' sean reconocidos como el mismo rol
        if (typeof rawRole === 'string') {
          userRole = rawRole.replace(/\"/g, ""); // Eliminar comillas adicionales
        } else {
          userRole = rawRole;
        }
        
        // Mostrar información del usuario para diagnóstico
        console.log("Documento del usuario encontrado:", userDocument);
        console.log("Rol del usuario (raw):", rawRole);
        console.log("Rol del usuario (limpio):", userRole);
      } else {
        console.log("No se encontró ningún documento para el email:", firebaseUser.email);
      }
      
      console.log("Rol de administrador esperado:", ADMIN_ROLE);
      console.log("¿Es administrador?", userRole === ADMIN_ROLE);
      
      // Crear objeto de usuario con la información necesaria
      const user = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || values.email.split('@')[0],
        role: userRole
      };
      
      // Guardar usuario en localStorage para mantener la sesión
      localStorage.setItem("currentUser", JSON.stringify(user));
      
      // Mostrar información sobre la redirección
      console.log("Redireccionando según el rol:", userRole);
      console.log("Tipo de userRole:", typeof userRole);
      console.log("Tipo de ADMIN_ROLE:", typeof ADMIN_ROLE);
      console.log("Valor de userRole:", JSON.stringify(userRole));
      console.log("Valor de ADMIN_ROLE:", JSON.stringify(ADMIN_ROLE));
      console.log("¿Es igual al rol de administrador?", userRole === ADMIN_ROLE);
      
      // Redireccionar según el rol - usando comparación de cadenas para mayor seguridad
      // Convertimos ambos valores a String para garantizar una comparación consistente
      // Esto permite que el rol "DhHkVja" en Firestore sea reconocido correctamente
      if (String(userRole) === String(ADMIN_ROLE)) {
        console.log("Usuario reconocido como administrador. Redireccionando a /admin");
        router.push("/admin");
      } else {
        console.log("Usuario reconocido como empleado. Redireccionando a /dashboard");
        router.push("/dashboard");
      }
      return;

      // Si llegamos aquí, el inicio de sesión falló
      form.setError("root", {
        message: "Correo electrónico o contraseña inválidos",
      })
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error de inicio de sesión",
        description: "Hubo un error al iniciar sesión. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tu correo electrónico y contraseña para acceder a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
