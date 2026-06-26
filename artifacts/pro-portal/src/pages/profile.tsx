import React from "react";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProGetProfile, useProUpdateProfile, getProGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

const profileSchema = z.object({
  phone: z.string().optional(),
  serviceZipCodes: z.string().min(5, "At least one ZIP code required"),
  servicesOffered: z.array(z.string()).min(1, "Select at least one service"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading } = useProGetProfile({
    query: { queryKey: getProGetProfileQueryKey() }
  });
  
  const updateProfileMutation = useProUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: "",
      serviceZipCodes: "",
      servicesOffered: [],
    },
  });

  // Load initial data
  React.useEffect(() => {
    if (profile) {
      form.reset({
        phone: profile.phone || "",
        serviceZipCodes: profile.serviceZipCodes.join(", "),
        servicesOffered: profile.servicesOffered,
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const zipCodes = data.serviceZipCodes
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean);

      await updateProfileMutation.mutateAsync({
        data: {
          phone: data.phone,
          serviceZipCodes: zipCodes,
          servicesOffered: data.servicesOffered,
        },
      });

      queryClient.invalidateQueries({ queryKey: getProGetProfileQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["proGetMe"] }); // Update layout data
      
      toast({
        title: "Profile Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: "Could not save your profile changes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-1/4 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-muted-foreground">Manage your settings and service areas.</p>
      </div>

      {!profile.approved && (
        <Alert variant="default" className="mb-6 bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account Pending Approval</AlertTitle>
          <AlertDescription>
            Your account is currently under review by our team. You can setup your profile, but you won't receive live leads until approved.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Approval Status</div>
                {profile.approved ? (
                  <Badge className="bg-green-100 text-green-800 border-0 flex w-fit items-center gap-1 dark:bg-green-900/40 dark:text-green-300">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex w-fit items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Pending Review
                  </Badge>
                )}
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Subscription Tier</div>
                <div className="capitalize font-medium">{profile.subscriptionStatus}</div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-1">Business Name</div>
                <div className="font-medium">{profile.businessName}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Owner</div>
                <div className="font-medium">{profile.ownerName}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Email (Login ID)</div>
                <div className="font-medium truncate">{profile.email}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Settings</CardTitle>
              <CardDescription>Update where you work and what you do</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormDescription>Displayed to homeowners matched with you.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceZipCodes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Area (ZIP Codes)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 90210, 90211" {...field} />
                        </FormControl>
                        <FormDescription>Comma-separated list. Leads outside these ZIPs won't be sent to you.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servicesOffered"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Services Offered</FormLabel>
                          <FormDescription>Select all that apply.</FormDescription>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
