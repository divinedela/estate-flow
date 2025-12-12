"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { FormSelect } from "@/components/ui/form-select";
import { createClient } from "@/lib/supabase/client";
import {
  Cog6ToothIcon,
  BellIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ServerIcon,
  CloudIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  KeyIcon,
  LanguageIcon,
  CalendarIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  settings: Record<string, any>;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  // Organization Settings
  const [orgSettings, setOrgSettings] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    taxId: "",
    registrationNumber: "",
  });

  // Regional Settings
  const [regionalSettings, setRegionalSettings] = useState({
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    currency: "USD",
    language: "en",
    firstDayOfWeek: "monday",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    lowStockAlerts: true,
    lowStockThreshold: "10",
    maintenanceAlerts: true,
    leaveRequestAlerts: true,
    projectDeadlineAlerts: true,
    invoiceOverdueAlerts: true,
    dailyDigest: false,
    weeklyReport: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: "30",
    passwordMinLength: "8",
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: false,
    passwordExpiry: "90",
    maxLoginAttempts: "5",
    twoFactorAuth: false,
    ipWhitelist: "",
    auditLogRetention: "365",
  });

  // Module Settings
  const [moduleSettings, setModuleSettings] = useState({
    hrEnabled: true,
    projectsEnabled: true,
    inventoryEnabled: true,
    facilitiesEnabled: true,
    purchasingEnabled: true,
    marketingEnabled: true,
    autoGenerateCodes: true,
    requireApprovals: true,
    allowNegativeStock: false,
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    primaryColor: "indigo",
    sidebarStyle: "expanded",
    compactMode: false,
    showBreadcrumbs: true,
    animationsEnabled: true,
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  async function fetchOrganization() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = (await supabase
      .from("app_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()) as { data: { organization_id: string } | null };

    if (!(profile as any)?.organization_id) {
      setLoading(false);
      return;
    }

    const { data: org } = (await supabase
      .from("organizations")
      .select("*")
      .eq("id", (profile as any).organization_id)
      .single()) as { data: Organization | null };

    if (org) {
      setOrganization(org);

      // Load organization settings
      setOrgSettings({
        name: org.name || "",
        code: org.code || "",
        email: org.email || "",
        phone: org.phone || "",
        address: org.address || "",
        website: org.settings?.website || "",
        taxId: org.settings?.taxId || "",
        registrationNumber: org.settings?.registrationNumber || "",
      });

      // Load saved settings from organization.settings JSONB
      if (org.settings) {
        if (org.settings.regional) {
          setRegionalSettings({
            ...regionalSettings,
            ...org.settings.regional,
          });
        }
        if (org.settings.notifications) {
          setNotificationSettings({
            ...notificationSettings,
            ...org.settings.notifications,
          });
        }
        if (org.settings.security) {
          setSecuritySettings({
            ...securitySettings,
            ...org.settings.security,
          });
        }
        if (org.settings.modules) {
          setModuleSettings({ ...moduleSettings, ...org.settings.modules });
        }
        if (org.settings.appearance) {
          setAppearanceSettings({
            ...appearanceSettings,
            ...org.settings.appearance,
          });
        }
      }
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!organization) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const updatedSettings = {
        ...organization.settings,
        website: orgSettings.website,
        taxId: orgSettings.taxId,
        registrationNumber: orgSettings.registrationNumber,
        regional: regionalSettings,
        notifications: notificationSettings,
        security: securitySettings,
        modules: moduleSettings,
        appearance: appearanceSettings,
        lastUpdated: new Date().toISOString(),
      };

      const { error } = await (supabase.from("organizations") as any)
        .update({
          name: orgSettings.name,
          code: orgSettings.code || null,
          email: orgSettings.email || null,
          phone: orgSettings.phone || null,
          address: orgSettings.address || null,
          settings: updatedSettings,
        })
        .eq("id", organization.id);

      if (error) throw error;

      setSaveMessage({ type: "success", text: "Settings saved successfully!" });

      // Refresh organization data
      await fetchOrganization();
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    }

    setSaving(false);

    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000);
  }

  const tabs = [
    { id: "organization", name: "Organization", icon: BuildingOfficeIcon },
    { id: "regional", name: "Regional", icon: GlobeAltIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
    { id: "modules", name: "Modules", icon: Cog6ToothIcon },
    { id: "appearance", name: "Appearance", icon: PaintBrushIcon },
    { id: "email", name: "Email", icon: EnvelopeIcon },
    { id: "integrations", name: "Integrations", icon: CloudIcon },
    { id: "backup", name: "Backup & Data", icon: ServerIcon },
  ];

  const timezones = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Europe/Berlin", label: "Berlin (CET)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
    { value: "Africa/Lagos", label: "Lagos (WAT)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
    { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
    { value: "Africa/Accra", label: "Accra (GMT)" },
  ];

  const currencies = [
    { value: "USD", label: "USD - US Dollar ($)", symbol: "$" },
    { value: "EUR", label: "EUR - Euro (€)", symbol: "€" },
    { value: "GBP", label: "GBP - British Pound (£)", symbol: "£" },
    { value: "CAD", label: "CAD - Canadian Dollar (C$)", symbol: "C$" },
    { value: "AUD", label: "AUD - Australian Dollar (A$)", symbol: "A$" },
    { value: "NGN", label: "NGN - Nigerian Naira (₦)", symbol: "₦" },
    { value: "GHS", label: "GHS - Ghanaian Cedi (₵)", symbol: "₵" },
    { value: "KES", label: "KES - Kenyan Shilling (KSh)", symbol: "KSh" },
    { value: "ZAR", label: "ZAR - South African Rand (R)", symbol: "R" },
    { value: "INR", label: "INR - Indian Rupee (₹)", symbol: "₹" },
    { value: "CNY", label: "CNY - Chinese Yuan (¥)", symbol: "¥" },
    { value: "JPY", label: "JPY - Japanese Yen (¥)", symbol: "¥" },
    { value: "AED", label: "AED - UAE Dirham (د.إ)", symbol: "د.إ" },
  ];

  const primaryColors = [
    { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "emerald", label: "Emerald", class: "bg-emerald-500" },
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "rose", label: "Rose", class: "bg-rose-500" },
    { value: "amber", label: "Amber", class: "bg-amber-500" },
    { value: "teal", label: "Teal", class: "bg-teal-500" },
    { value: "slate", label: "Slate", class: "bg-slate-500" },
  ];

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          checked ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/admin"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Admin Dashboard
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-sm text-gray-500">System Settings</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                System Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure system-wide settings and preferences for{" "}
                {organization?.name || "your organization"}
              </p>
            </div>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`rounded-lg p-4 ${
              saveMessage.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center">
              {saveMessage.type === "success" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              )}
              <p
                className={`text-sm font-medium ${
                  saveMessage.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {saveMessage.text}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <Card>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <tab.icon
                      className={`mr-3 h-5 w-5 ${
                        activeTab === tab.id
                          ? "text-indigo-600"
                          : "text-gray-400"
                      }`}
                    />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="flex-1 space-y-6">
            {/* Organization Settings */}
            {activeTab === "organization" && (
              <Card title="Organization Information">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 pb-6 border-b">
                    <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      {organization?.logo_url ? (
                        <img
                          src={organization.logo_url}
                          alt="Logo"
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <PhotoIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <Button variant="secondary" size="sm">
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Organization Name"
                      value={orgSettings.name}
                      onChange={(e) =>
                        setOrgSettings({ ...orgSettings, name: e.target.value })
                      }
                      required
                    />
                    <FormInput
                      label="Organization Code"
                      value={orgSettings.code}
                      onChange={(e) =>
                        setOrgSettings({ ...orgSettings, code: e.target.value })
                      }
                      placeholder="e.g., ACME"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Email"
                      type="email"
                      value={orgSettings.email}
                      onChange={(e) =>
                        setOrgSettings({
                          ...orgSettings,
                          email: e.target.value,
                        })
                      }
                    />
                    <FormInput
                      label="Phone"
                      value={orgSettings.phone}
                      onChange={(e) =>
                        setOrgSettings({
                          ...orgSettings,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>

                  <FormTextarea
                    label="Address"
                    value={orgSettings.address}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        address: e.target.value,
                      })
                    }
                    rows={2}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Website"
                      value={orgSettings.website}
                      onChange={(e) =>
                        setOrgSettings({
                          ...orgSettings,
                          website: e.target.value,
                        })
                      }
                      placeholder="https://www.example.com"
                    />
                    <FormInput
                      label="Tax ID / VAT Number"
                      value={orgSettings.taxId}
                      onChange={(e) =>
                        setOrgSettings({
                          ...orgSettings,
                          taxId: e.target.value,
                        })
                      }
                    />
                  </div>

                  <FormInput
                    label="Registration Number"
                    value={orgSettings.registrationNumber}
                    onChange={(e) =>
                      setOrgSettings({
                        ...orgSettings,
                        registrationNumber: e.target.value,
                      })
                    }
                    placeholder="Business registration number"
                  />

                  <div className="pt-4 border-t">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Regional Settings */}
            {activeTab === "regional" && (
              <Card title="Regional Settings">
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        These settings affect how dates, times, and currencies
                        are displayed throughout the application.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormSelect
                      label="Timezone"
                      value={regionalSettings.timezone}
                      onChange={(e) =>
                        setRegionalSettings({
                          ...regionalSettings,
                          timezone: e.target.value,
                        })
                      }
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect
                      label="Language"
                      value={regionalSettings.language}
                      onChange={(e) =>
                        setRegionalSettings({
                          ...regionalSettings,
                          language: e.target.value,
                        })
                      }
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="de">German</option>
                      <option value="pt">Portuguese</option>
                      <option value="ar">Arabic</option>
                      <option value="zh">Chinese</option>
                    </FormSelect>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormSelect
                      label="Date Format"
                      value={regionalSettings.dateFormat}
                      onChange={(e) =>
                        setRegionalSettings({
                          ...regionalSettings,
                          dateFormat: e.target.value,
                        })
                      }
                    >
                      <option value="YYYY-MM-DD">
                        YYYY-MM-DD (2024-12-08)
                      </option>
                      <option value="DD/MM/YYYY">
                        DD/MM/YYYY (08/12/2024)
                      </option>
                      <option value="MM/DD/YYYY">
                        MM/DD/YYYY (12/08/2024)
                      </option>
                      <option value="DD-MM-YYYY">
                        DD-MM-YYYY (08-12-2024)
                      </option>
                      <option value="MMM DD, YYYY">
                        MMM DD, YYYY (Dec 08, 2024)
                      </option>
                    </FormSelect>
                    <FormSelect
                      label="Time Format"
                      value={regionalSettings.timeFormat}
                      onChange={(e) =>
                        setRegionalSettings({
                          ...regionalSettings,
                          timeFormat: e.target.value,
                        })
                      }
                    >
                      <option value="24h">24-hour (14:30)</option>
                      <option value="12h">12-hour (2:30 PM)</option>
                    </FormSelect>
                    <FormSelect
                      label="First Day of Week"
                      value={regionalSettings.firstDayOfWeek}
                      onChange={(e) =>
                        setRegionalSettings({
                          ...regionalSettings,
                          firstDayOfWeek: e.target.value,
                        })
                      }
                    >
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                      <option value="saturday">Saturday</option>
                    </FormSelect>
                  </div>

                  <FormSelect
                    label="Default Currency"
                    value={regionalSettings.currency}
                    onChange={(e) =>
                      setRegionalSettings({
                        ...regionalSettings,
                        currency: e.target.value,
                      })
                    }
                  >
                    {currencies.map((curr) => (
                      <option key={curr.value} value={curr.value}>
                        {curr.label}
                      </option>
                    ))}
                  </FormSelect>

                  <div className="pt-4 border-t">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <Card title="General Notifications">
                  <div className="divide-y">
                    <ToggleSwitch
                      checked={notificationSettings.emailNotifications}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                      label="Email Notifications"
                      description="Receive notifications via email"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.pushNotifications}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: checked,
                        })
                      }
                      label="Push Notifications"
                      description="Receive in-app push notifications"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.dailyDigest}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          dailyDigest: checked,
                        })
                      }
                      label="Daily Digest"
                      description="Receive a daily summary email"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.weeklyReport}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          weeklyReport: checked,
                        })
                      }
                      label="Weekly Report"
                      description="Receive weekly activity reports"
                    />
                  </div>
                </Card>

                <Card title="Alert Settings">
                  <div className="divide-y">
                    <ToggleSwitch
                      checked={notificationSettings.lowStockAlerts}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          lowStockAlerts: checked,
                        })
                      }
                      label="Low Stock Alerts"
                      description="Get notified when inventory is low"
                    />
                    {notificationSettings.lowStockAlerts && (
                      <div className="py-3">
                        <FormInput
                          label="Low Stock Threshold"
                          type="number"
                          value={notificationSettings.lowStockThreshold}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              lowStockThreshold: e.target.value,
                            })
                          }
                          placeholder="10"
                        />
                      </div>
                    )}
                    <ToggleSwitch
                      checked={notificationSettings.maintenanceAlerts}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          maintenanceAlerts: checked,
                        })
                      }
                      label="Maintenance Alerts"
                      description="Get notified about maintenance requests"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.leaveRequestAlerts}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          leaveRequestAlerts: checked,
                        })
                      }
                      label="Leave Request Alerts"
                      description="Get notified about leave requests"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.projectDeadlineAlerts}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          projectDeadlineAlerts: checked,
                        })
                      }
                      label="Project Deadline Alerts"
                      description="Get notified about upcoming deadlines"
                    />
                    <ToggleSwitch
                      checked={notificationSettings.invoiceOverdueAlerts}
                      onChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          invoiceOverdueAlerts: checked,
                        })
                      }
                      label="Invoice Overdue Alerts"
                      description="Get notified about overdue invoices"
                    />
                  </div>
                  <div className="pt-4 mt-4 border-t">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <Card title="Session & Authentication">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormSelect
                        label="Session Timeout"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            sessionTimeout: e.target.value,
                          })
                        }
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="480">8 hours</option>
                        <option value="1440">24 hours</option>
                      </FormSelect>
                      <FormSelect
                        label="Max Login Attempts"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            maxLoginAttempts: e.target.value,
                          })
                        }
                      >
                        <option value="3">3 attempts</option>
                        <option value="5">5 attempts</option>
                        <option value="10">10 attempts</option>
                        <option value="unlimited">Unlimited</option>
                      </FormSelect>
                    </div>
                    <ToggleSwitch
                      checked={securitySettings.twoFactorAuth}
                      onChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          twoFactorAuth: checked,
                        })
                      }
                      label="Two-Factor Authentication"
                      description="Require 2FA for all users"
                    />
                  </div>
                </Card>

                <Card title="Password Policy">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormSelect
                        label="Minimum Password Length"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            passwordMinLength: e.target.value,
                          })
                        }
                      >
                        <option value="6">6 characters</option>
                        <option value="8">8 characters</option>
                        <option value="10">10 characters</option>
                        <option value="12">12 characters</option>
                      </FormSelect>
                      <FormSelect
                        label="Password Expiry"
                        value={securitySettings.passwordExpiry}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            passwordExpiry: e.target.value,
                          })
                        }
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="never">Never</option>
                      </FormSelect>
                    </div>
                    <div className="divide-y">
                      <ToggleSwitch
                        checked={securitySettings.passwordRequireUppercase}
                        onChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            passwordRequireUppercase: checked,
                          })
                        }
                        label="Require Uppercase Letters"
                        description="Passwords must contain at least one uppercase letter"
                      />
                      <ToggleSwitch
                        checked={securitySettings.passwordRequireNumbers}
                        onChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            passwordRequireNumbers: checked,
                          })
                        }
                        label="Require Numbers"
                        description="Passwords must contain at least one number"
                      />
                      <ToggleSwitch
                        checked={securitySettings.passwordRequireSpecial}
                        onChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            passwordRequireSpecial: checked,
                          })
                        }
                        label="Require Special Characters"
                        description="Passwords must contain at least one special character"
                      />
                    </div>
                  </div>
                </Card>

                <Card title="Advanced Security">
                  <div className="space-y-4">
                    <FormTextarea
                      label="IP Whitelist"
                      value={securitySettings.ipWhitelist}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          ipWhitelist: e.target.value,
                        })
                      }
                      placeholder="Enter IP addresses (one per line). Leave empty to allow all."
                      rows={3}
                    />
                    <FormSelect
                      label="Audit Log Retention"
                      value={securitySettings.auditLogRetention}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          auditLogRetention: e.target.value,
                        })
                      }
                    >
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                      <option value="730">2 years</option>
                      <option value="forever">Forever</option>
                    </FormSelect>
                  </div>
                  <div className="pt-4 mt-4 border-t">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Module Settings */}
            {activeTab === "modules" && (
              <div className="space-y-6">
                <Card title="Enable/Disable Modules">
                  <div className="divide-y">
                    <ToggleSwitch
                      checked={moduleSettings.hrEnabled}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          hrEnabled: checked,
                        })
                      }
                      label="HR Module"
                      description="Employee management, leave, attendance, payroll"
                    />
                    <ToggleSwitch
                      checked={moduleSettings.projectsEnabled}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          projectsEnabled: checked,
                        })
                      }
                      label="Projects Module"
                      description="Project management, tasks, milestones"
                    />
                    <ToggleSwitch
                      checked={moduleSettings.inventoryEnabled}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          inventoryEnabled: checked,
                        })
                      }
                      label="Inventory Module"
                      description="Stock management, items, transactions"
                    />
                    <ToggleSwitch
                      checked={moduleSettings.facilitiesEnabled}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          facilitiesEnabled: checked,
                        })
                      }
                      label="Facilities Module"
                      description="Property management, maintenance, assets"
                    />
                    <ToggleSwitch
                      checked={moduleSettings.purchasingEnabled}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          purchasingEnabled: checked,
                        })
                      }
                      label="Purchasing Module"
                      description="Procurement, suppliers, purchase orders"
                    />
                    <ToggleSwitch
                      checked={moduleSettings.marketingEnabled}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          marketingEnabled: checked,
                        })
                      }
                      label="Marketing / CRM Module"
                      description="Leads, contacts, campaigns"
                    />
                  </div>
                </Card>

                <Card title="Module Behavior">
                  <div className="divide-y">
                    <ToggleSwitch
                      checked={moduleSettings.autoGenerateCodes}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          autoGenerateCodes: checked,
                        })
                      }
                      label="Auto-Generate Codes"
                      description="Automatically generate codes for items, POs, etc."
                    />
                    <ToggleSwitch
                      checked={moduleSettings.requireApprovals}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          requireApprovals: checked,
                        })
                      }
                      label="Require Approvals"
                      description="Require approval workflows for PRs, leave requests, etc."
                    />
                    <ToggleSwitch
                      checked={moduleSettings.allowNegativeStock}
                      onChange={(checked) =>
                        setModuleSettings({
                          ...moduleSettings,
                          allowNegativeStock: checked,
                        })
                      }
                      label="Allow Negative Stock"
                      description="Allow stock levels to go below zero"
                    />
                  </div>
                  <div className="pt-4 mt-4 border-t">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <Card title="Appearance Settings">
                <div className="space-y-6">
                  <FormSelect
                    label="Theme"
                    value={appearanceSettings.theme}
                    onChange={(e) =>
                      setAppearanceSettings({
                        ...appearanceSettings,
                        theme: e.target.value,
                      })
                    }
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </FormSelect>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {primaryColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() =>
                            setAppearanceSettings({
                              ...appearanceSettings,
                              primaryColor: color.value,
                            })
                          }
                          className={`h-10 w-10 rounded-lg ${color.class} ${
                            appearanceSettings.primaryColor === color.value
                              ? "ring-2 ring-offset-2 ring-gray-900"
                              : ""
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <FormSelect
                    label="Sidebar Style"
                    value={appearanceSettings.sidebarStyle}
                    onChange={(e) =>
                      setAppearanceSettings({
                        ...appearanceSettings,
                        sidebarStyle: e.target.value,
                      })
                    }
                  >
                    <option value="expanded">Always Expanded</option>
                    <option value="collapsed">Always Collapsed</option>
                    <option value="auto">
                      Auto (Collapse on small screens)
                    </option>
                  </FormSelect>

                  <div className="divide-y">
                    <ToggleSwitch
                      checked={appearanceSettings.compactMode}
                      onChange={(checked) =>
                        setAppearanceSettings({
                          ...appearanceSettings,
                          compactMode: checked,
                        })
                      }
                      label="Compact Mode"
                      description="Reduce spacing for more content on screen"
                    />
                    <ToggleSwitch
                      checked={appearanceSettings.showBreadcrumbs}
                      onChange={(checked) =>
                        setAppearanceSettings({
                          ...appearanceSettings,
                          showBreadcrumbs: checked,
                        })
                      }
                      label="Show Breadcrumbs"
                      description="Display navigation breadcrumbs"
                    />
                    <ToggleSwitch
                      checked={appearanceSettings.animationsEnabled}
                      onChange={(checked) =>
                        setAppearanceSettings({
                          ...appearanceSettings,
                          animationsEnabled: checked,
                        })
                      }
                      label="Enable Animations"
                      description="Show smooth transitions and animations"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Email Settings */}
            {activeTab === "email" && (
              <Card title="Email Configuration">
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Email is configured through Supabase. Visit your
                        Supabase dashboard to configure email templates and SMTP
                        settings.
                      </p>
                    </div>
                  </div>
                  <FormInput
                    label="From Email Address"
                    type="email"
                    placeholder="noreply@estateflow.com"
                    disabled
                  />
                  <FormInput
                    label="From Name"
                    placeholder="Estate Flow"
                    disabled
                  />
                  <div className="pt-4">
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      Open Supabase Dashboard
                      <GlobeAltIcon className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              </Card>
            )}

            {/* Integrations */}
            {activeTab === "integrations" && (
              <Card title="Integrations">
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                          <ServerIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Supabase</p>
                          <p className="text-sm text-gray-500">
                            Database and authentication
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Connected
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                          <EnvelopeIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Email Service
                          </p>
                          <p className="text-sm text-gray-500">
                            Transactional emails
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Connected
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                          <CloudIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            File Storage
                          </p>
                          <p className="text-sm text-gray-500">
                            Document and image storage
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Connected
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            SMS Gateway
                          </p>
                          <p className="text-sm text-gray-500">
                            SMS notifications
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">
                        Configure
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Payment Gateway
                          </p>
                          <p className="text-sm text-gray-500">
                            Payment processing
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Backup & Data */}
            {activeTab === "backup" && (
              <div className="space-y-6">
                <Card title="Data Export">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Export your organization&apos;s data for backup or
                      migration purposes.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="secondary">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Export All Data (JSON)
                      </Button>
                      <Button variant="secondary">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Export All Data (CSV)
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card title="Database Information">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Database Provider</p>
                        <p className="font-medium">Supabase (PostgreSQL)</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Region</p>
                        <p className="font-medium">Auto-selected</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Backup Frequency</p>
                        <p className="font-medium">
                          Daily (Managed by Supabase)
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Retention Period</p>
                        <p className="font-medium">7 days</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        Manage Database in Supabase
                        <GlobeAltIcon className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </Card>

                <Card title="Danger Zone" className="border-red-200">
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-red-800">Caution</p>
                          <p className="text-sm text-red-700 mt-1">
                            These actions are irreversible. Please proceed with
                            extreme caution.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="font-medium text-gray-900">
                          Reset All Settings
                        </p>
                        <p className="text-sm text-gray-500">
                          Reset all settings to default values
                        </p>
                      </div>
                      <Button variant="danger" size="sm">
                        Reset Settings
                      </Button>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          Delete All Data
                        </p>
                        <p className="text-sm text-gray-500">
                          Permanently delete all organization data
                        </p>
                      </div>
                      <Button variant="danger" size="sm">
                        Delete Data
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
