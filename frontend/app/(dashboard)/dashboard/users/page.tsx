'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, UserPlus, RefreshCw } from 'lucide-react'
import { CyberPanel, CyberPanelHeader, CyberInput, CyberSelect, CyberButton, CyberBadge } from '@/components/cyber'
import { api, isApiError } from '@/lib/api'
import { getJwtRole } from '@/lib/auth'
import type { CreateUserPayload, User } from '@/lib/types'

const FORBIDDEN_MESSAGE = 'ADMIN_ROLE_REQUIRED: this action needs an admin JWT'

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isProvisioning, setIsProvisioning] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    const [formData, setFormData] = useState<CreateUserPayload>({
        username: '',
        email: '',
        password: '',
        role: 'standard'
    })

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const data = await api.getUsers()
            setUsers(Array.isArray(data) ? data : [])
        } catch (err: unknown) {
            if (isApiError(err) && err.status === 403) {
                setError(FORBIDDEN_MESSAGE)
            } else {
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setIsAdmin(getJwtRole() === 'admin')
        fetchUsers()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsProvisioning(true)
        setError('')
        setSuccess('')

        try {
            await api.register(formData)
            setSuccess("USER_PROVISIONED_SUCCESSFULLY")
            setFormData({ username: '', email: '', password: '', role: 'standard' })
            fetchUsers()
        } catch (err: unknown) {
            if (isApiError(err) && err.status === 403) {
                setError(FORBIDDEN_MESSAGE)
            } else {
                setError(err instanceof Error ? err.message : 'Failed to provision user')
            }
        } finally {
            setIsProvisioning(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-mono uppercase tracking-tighter text-foreground flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" />
                        {'>_ USERS_CONTROLLER'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Identity and Clearance Level Management.</p>
                </div>
                <CyberButton variant="secondary" size="sm" onClick={fetchUsers} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="ml-2">REFRESH_DB</span>
                </CyberButton>
            </div>

            {error && !isAdmin && (
                <div className="text-destructive text-xs uppercase tracking-widest font-bold border border-destructive/30 bg-destructive/10 p-3 rounded-sm">
                    [!] {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    <CyberPanel glow="orange">
                        <CyberPanelHeader title="ACTIVE_IDENTITIES" />
                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border font-mono">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">USERNAME</th>
                                        <th className="px-4 py-3">EMAIL</th>
                                        <th className="px-4 py-3 text-right">CLEARANCE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">SCANNING_RECORDS...</td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">NO_RECORDS_FOUND</td>
                                        </tr>
                                    ) : (
                                        users.map((user: User) => (
                                            <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors font-mono">
                                                <td className="px-4 py-3 text-muted-foreground">#{user.id}</td>
                                                <td className="px-4 py-3 font-medium text-primary">{user.username}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <CyberBadge variant={user.role === 'admin' ? 'info' : 'default'}>
                                                        <Shield className="w-3 h-3 mr-1 inline-block" />
                                                        {user.role ? user.role.toUpperCase() : 'STANDARD'}
                                                    </CyberBadge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CyberPanel>
                </div>

                {isAdmin && (
                <div className="lg:col-span-1">
                    <CyberPanel glow="mint">
                        <CyberPanelHeader title="PROVISION_USER" />
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <CyberInput
                                label="Username"
                                placeholder="e.g. sysadmin_01"
                                value={formData.username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                            <CyberInput
                                label="Email"
                                type="email"
                                placeholder="e.g. admin@openward.net"
                                value={formData.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <CyberInput
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <CyberSelect
                                label="Clearance Level (Role)"
                                options={[
                                    { value: 'standard', label: 'STANDARD' },
                                    { value: 'admin', label: 'ADMIN' },
                                ]}
                                value={formData.role}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, role: e.target.value })}
                            />

                            {error && (
                                <div className="text-destructive text-xs uppercase tracking-widest font-bold border border-destructive/30 bg-destructive/10 p-2 rounded-sm text-center">
                                    [!] {error}
                                </div>
                            )}

                            {success && (
                                <div className="text-primary text-xs uppercase tracking-widest font-bold border border-primary/30 bg-primary/10 p-2 rounded-sm text-center">
                                    [+] {success}
                                </div>
                            )}

                            <CyberButton type="submit" className="w-full mt-2" disabled={isProvisioning}>
                                <span className="flex items-center justify-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    {isProvisioning ? "PROVISIONING..." : "[+] PROVISION_USER"}
                                </span>
                            </CyberButton>
                        </form>
                    </CyberPanel>
                </div>
                )}
            </div>
        </motion.div>
    )
}
