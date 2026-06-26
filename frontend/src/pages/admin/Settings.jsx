import { useState } from 'react'
import axios from '@/lib/axios'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Save, Upload, Lock, Loader2, CheckCircle2, User } from 'lucide-react'

function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return '?'
  return ((firstName || '')[0] || '') + ((lastName || '')[0] || '')
}

export default function AdminSettings() {
  const { admin, setAdmin } = useAdminAuth()

  const [firstName, setFirstName] = useState(admin?.firstName || '')
  const [lastName, setLastName] = useState(admin?.lastName || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState(null)

  async function handleProfileUpdate(e) {
    e.preventDefault()
    try {
      setProfileSaving(true)
      setProfileMessage(null)
      const { data } = await axios.put('/api/admin/profile', { firstName, lastName })
      if (data.user || data.admin) setAdmin(data.user || data.admin)
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile',
      })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    try {
      setPasswordSaving(true)
      setPasswordMessage(null)
      await axios.put('/api/admin/profile/change-password', {
        currentPassword,
        newPassword,
      })
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password',
      })
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setAvatarUploading(true)
      setAvatarMessage(null)
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await axios.put('/api/admin/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.user || data.admin) setAdmin(data.user || data.admin)
      setAvatarMessage({ type: 'success', text: 'Avatar updated successfully' })
    } catch (err) {
      setAvatarMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload avatar',
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your profile and account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarImage src={admin?.avatar} />
                <AvatarFallback className="text-lg">
                  {getInitials(admin?.firstName, admin?.lastName)}
                </AvatarFallback>
              </Avatar>
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="size-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">
                {admin?.firstName} {admin?.lastName}
              </p>
              <p className="text-xs text-zinc-500">{admin?.email}</p>
              <label className="inline-flex items-center gap-1.5 mt-2 cursor-pointer text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
                <Upload className="size-3.5" />
                <span>Change avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </label>
            </div>
          </div>

          {avatarMessage && (
            <div
              className={`flex items-center gap-2 text-xs ${
                avatarMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {avatarMessage.type === 'success' ? (
                <CheckCircle2 className="size-3.5" />
              ) : null}
              {avatarMessage.text}
            </div>
          )}

          <Separator />

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={admin?.email || ''} disabled className="text-zinc-500" />
            </div>

            {profileMessage && (
              <div
                className={`flex items-center gap-2 text-xs ${
                  profileMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="size-3.5" />
                ) : null}
                {profileMessage.text}
              </div>
            )}

            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {passwordMessage && (
              <div
                className={`flex items-center gap-2 text-xs ${
                  passwordMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="size-3.5" />
                ) : null}
                {passwordMessage.text}
              </div>
            )}

            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
