import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Leaf } from "lucide-react";

const SERVICE_OPTIONS = [
  "Lawn Mowing",
  "Fertilization",
  "Weed Control",
  "Aeration",
  "Pest Control",
  "Irrigation",
  "Landscaping",
  "Other"
];

const registerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  serviceZipCodes: z.string().min(5, "At least one ZIP code required"),
  servicesOffered: z.array(z.string()).min(1, "Select at least one service"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useProRegister();
  const [success, setSuccess] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      email: "",
      password: "",
      phone: "",
      serviceZipCodes: "",
      servicesOffered: [],
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const zipCodes = data.serviceZipCodes
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean);

      await registerMutation.mutateAsync({
        data: {
          ...data,
          serviceZipCodes: zipCodes,
        },
      });

      setSuccess(true);
      toast({
        title: "Application Submitted",
        description: "Your partner application is pending approval.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6" />
            </div>
            <CardTitle>Application Received</CardTitle>
            <CardDescription>
              Thank you for applying to join LawnRX Partners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              Your account is currently pending approval. We will review your application and email you once you've been approved to receive leads.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Become a Partner</h1>
          <p className="text-muted-foreground mt-1">Get qualified leads directly to your inbox</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Lawn Care" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceZipCodes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Service Area (ZIP Codes)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 90210, 90211, 90212" {...field} />
                        </FormControl>
                        <FormDescription>Comma-separated list of ZIP codes you service.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="servicesOffered"
                    render={() => (
                      <FormItem className="md:col-span-2">
                        <div className="mb-4">
                          <FormLabel className="text-base">Services Offered</FormLabel>
                          <FormDescription>Select all that apply.</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {SERVICE_OPTIONS.map((service) => (
                            <FormField
                              key={service}
                              control={form.control}
                              name="servicesOffered"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={service}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, service])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== service
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {service}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <div className="text-sm text-muted-foreground">
              Already a partner?{" "}
              <Link href="/" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
