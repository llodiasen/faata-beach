export interface Permission {
  id: string
  name: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
}

export const roles: Role[] = [
  {
    id: 'visitor',
    name: 'Visiteur',
    permissions: [
      'view_menu',
      'add_to_cart',
      'create_order',
      'track_order'
    ]
  },
  {
    id: 'customer',
    name: 'Client',
    permissions: [
      'view_menu',
      'add_to_cart',
      'create_order',
      'track_order',
      'view_profile',
      'edit_profile',
      'view_order_history',
      'view_expenses',
      'make_reservation'
    ]
  },
  {
    id: 'admin',
    name: 'Administrateur',
    permissions: [
      'view_dashboard',
      'manage_orders',
      'assign_delivery',
      'manage_products',
      'manage_categories',
      'view_statistics',
      'view_all_histories',
      'manage_reservations',
      'view_revenues'
    ]
  },
  {
    id: 'delivery',
    name: 'Livreur',
    permissions: [
      'view_assigned_orders',
      'update_order_status',
      'access_geolocation',
      'confirm_delivery',
      'view_delivery_history'
    ]
  }
]

export function hasPermission(userRole: string | null, permission: string): boolean {
  if (!userRole || userRole === 'visitor') {
    // Vérifier les permissions visitor
    const visitorRole = roles.find(r => r.id === 'visitor')
    return visitorRole?.permissions.includes(permission) || false
  }
  
  const role = roles.find(r => r.id === userRole)
  return role?.permissions.includes(permission) || false
}

export function getUserRole(user: { role?: string } | null): string {
  return user?.role || 'visitor'
}

