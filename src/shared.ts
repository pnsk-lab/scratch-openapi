export interface ClassroomInfo {
	id: number
	name?: string // Add more fields as needed
	educator?: {
		profile?: {
			country?: string
		}
	}
}

export interface StudioUserRole {
	manager: boolean
	curator: boolean
	following: boolean
	invited: boolean
}
