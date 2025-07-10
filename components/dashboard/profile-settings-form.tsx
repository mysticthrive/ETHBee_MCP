"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@/store/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { TimezoneSelector } from "@/components/wallet/timezone-selector"
import { getUserTimezone } from "@/lib/utils/timezone-utils"
import { useDispatch } from "react-redux"
import { updateUserTimezone } from "@/store/auth-slice"

interface ProfileFormData {
  email: string
  first_name: string
  last_name: string
  timezone: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  priceAlerts: boolean
  tradingSignals: boolean
}

export function ProfileSettingsForm() {
  const user = useUser()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")

  const [formData, setFormData] = useState<ProfileFormData>({
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    timezone: user?.timezone || getUserTimezone(),
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    priceAlerts: true,
    tradingSignals: true,
  })

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        timezone: user.timezone || getUserTimezone(),
      }))
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTimezoneChange = (timezone: string) => {
    setFormData((prev) => ({ ...prev, timezone }))
  }

  const handleToggleChange = (setting: keyof NotificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          updates: {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            timezone: formData.timezone,
          },
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Failed to update profile")
        toast({
          title: "Update failed",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        })
        return
      }

      setSuccess("Profile updated successfully")
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      })
      // Update timezone in Redux if it changed
      if (user?.timezone !== formData.timezone) {
        dispatch(updateUserTimezone(formData.timezone))
      }
    } catch (err) {
      setError("An unexpected error occurred")
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          updates: {
            password: formData.newPassword,
          },
          currentPassword: formData.currentPassword,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Failed to update password")
        toast({
          title: "Password update failed",
          description: data.error || "Failed to update password",
          variant: "destructive",
        })
        return
      }

      setSuccess("Password updated successfully")
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (err) {
      setError("An unexpected error occurred")
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          updates: {
            notification_preferences: {
              email_notifications: notificationSettings.emailNotifications,
              price_alerts: notificationSettings.priceAlerts,
              trading_signals: notificationSettings.tradingSignals,
            },
          },
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Failed to update notification settings")
        toast({
          title: "Update failed",
          description: data.error || "Failed to update notification settings",
          variant: "destructive",
        })
        return
      }

      setSuccess("Notification settings updated successfully")
      toast({
        title: "Settings updated",
        description: "Your notification settings have been updated successfully",
      })
    } catch (err) {
      setError("An unexpected error occurred")
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black/30 backdrop-blur-md border-yellow-500/10 w-full">
      <CardHeader>
        <CardTitle className="text-white">Account Settings</CardTitle>
        <CardDescription className="text-gray-400">Manage your account settings and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="timezone"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
            >
              Timezone
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
            >
              Password
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
            >
              Notifications
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 mb-4 border-red-500/50">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-900/20 mb-4 border-green-500/50">
              <Check className="w-4 h-4 text-green-500" />
              <AlertDescription className="text-green-500">{success}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="profile">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-400">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-black/40 border-gray-800 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_id" className="text-gray-400">
                    User ID
                  </Label>
                  <Input
                    id="user_id"
                    value={user?.id || ""}
                    readOnly
                    className="bg-black/40 border-gray-800 text-gray-500"
                  />
                </div>
              </div>
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-gray-400">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="bg-black/40 border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-gray-400">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="bg-black/40 border-gray-800 text-white"
                  />
                </div>
              </div>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="timezone">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-900/20 p-4 border-blue-500/50 rounded-lg">
                  <h4 className="mb-2 font-medium text-blue-400">Why set your timezone?</h4>
                  <p className="text-gray-300 text-sm">
                    Setting your timezone ensures that all booking orders, notifications, and time-based features work
                    correctly according to your local time. This is especially important for scheduled trades and
                    time-sensitive operations.
                  </p>
                </div>

                <TimezoneSelector
                  value={formData.timezone}
                  onChange={handleTimezoneChange}
                  label="Your Timezone"
                  showCurrentTime={true}
                  showDetectButton={true}
                />

                <div className="bg-gray-900/40 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">
                    <strong className="text-white">Current setting:</strong> {formData.timezone}
                  </p>
                </div>
              </div>

              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Timezone"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-400">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="bg-black/40 border-gray-800 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-400">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="bg-black/40 border-gray-800 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-400">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-black/40 border-gray-800 text-white"
                  required
                />
              </div>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="notifications">
            <form onSubmit={handleNotificationUpdate} className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="emailNotifications" className="text-white">
                      Email Notifications
                    </Label>
                    <p className="text-gray-400 text-xs">Receive important updates via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleToggleChange("emailNotifications")}
                    className="data-[state=checked]:bg-yellow-600"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="priceAlerts" className="text-white">
                      Price Alerts
                    </Label>
                    <p className="text-gray-400 text-xs">Get notified about significant price changes</p>
                  </div>
                  <Switch
                    id="priceAlerts"
                    checked={notificationSettings.priceAlerts}
                    onCheckedChange={() => handleToggleChange("priceAlerts")}
                    className="data-[state=checked]:bg-yellow-600"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="tradingSignals" className="text-white">
                      AI Trading Signals
                    </Label>
                    <p className="text-gray-400 text-xs">Receive AI-generated trading recommendations</p>
                  </div>
                  <Switch
                    id="tradingSignals"
                    checked={notificationSettings.tradingSignals}
                    onCheckedChange={() => handleToggleChange("tradingSignals")}
                    className="data-[state=checked]:bg-yellow-600"
                  />
                </div>
              </div>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
