// scratch-core-api.ts
import { typiaToOpenAPI } from '@pnsk-lab/typia-openapi'
import typia from 'typia'
import type { ClassroomInfo, StudioUserRole } from '../shared'

// --- Type Definitions for API Payloads and Responses ---

interface ProjectInfo {
	id: number
	title: string
	instructions: string
	author: {
		id: number
		username: string
		profile?: {
			// Assuming profile and images might be nested
			images?: {
				'90x90'?: string
				'60x60'?: string
				'50x50'?: string
				'32x32'?: string
			}
		}
	}
	image: string // URL to project thumbnail
	history: {
		created: string // ISO 8601 string
		modified: string // ISO 8601 string
		shared: string // ISO 8601 string
	}
	stats: {
		views: number
		loves: number
		favorites: number
		comments: number
		remixes: number
	}
	remix: {
		parent: number
		root: number
	}
	project_token?: string // Appears on project info endpoint responses
}

interface ProjectUpdateRequestBody {
	instructions?: string
	notesAndCredits?: string
}

interface Comment {
	id: number
	content: string
	datetime_created: string // ISO 8601 string
	author: {
		id: number
		username: string
		image: string // URL to avatar
		scratchteam?: boolean
	}
	parent_id?: number // For replies
	commentee_id?: number // For replies
	reply_count?: number // Only for top-level comments
	visibility?: 'visible' | 'markedbyfilter' | 'reported' | 'deleted'
	// Additional fields for moderation or internal use
	is_admin?: boolean
	is_comment_owner?: boolean
	moreRepliesToLoad?: boolean // Client-side flag
}

interface AddCommentRequestBody {
	content: string
	parent_id?: number | ''
	commentee_id?: number | ''
}

interface MuteStatus {
	muteExpiresAt: number // Unix timestamp in seconds
	offenses: unknown[] // Array of offense objects
	currentMessageType?: string
	showWarning?: boolean
}

interface CommentPostResponse {
	id: number
	content: string
	datetime_created: string
	author: {
		id: number
		username: string // Often needs to be filled in client-side after initial post
		image: string
	}
	parent_id?: number
	commentee_id?: number
	rejected?: string // Error string if comment was rejected by server
	appealId?: string // ID for moderation appeal
	status?: {
		// Status about user's mute state
		mute_status?: MuteStatus
	}
}

interface FeaturedContentResponse {
	community_featured_projects?: ProjectInfo[]
	community_featured_studios?: StudioInfo[] // Assuming StudioInfo from previous schema
	curator_top_projects?: ProjectInfo[]
	scratch_design_studio?: ProjectInfo[]
	community_most_remixed_projects?: ProjectInfo[]
	community_most_loved_projects?: ProjectInfo[]
}

interface StudioInfo {
	id: number
	title: string
	description: string
	image: string
	open_to_all: boolean
	comments_allowed: boolean
	history: {
		created: string
		modified: string
	}
	stats: {
		comments: number
		followers: number
		managers: number
		projects: number
	}
	host: number
	public: boolean
}

interface StudioMember {
	// For Managers and Curators
	id: number
	username: string
	profile: {
		id: number
		images: {
			'90x90': string
			'60x60': string
			'50x50': string
			'32x32': string
		}
	}
	// May include other fields like "status", "date_joined" etc.
}

export default typiaToOpenAPI({
	openapi: '3.0.0',
	info: {
		title: 'Scratch Core API',
		version: '1.0.0',
		description:
			'Core API endpoints for managing Scratch projects, studios, and user data. These endpoints are often accessed via proxies on the `scratch.mit.edu` domain or directly via `api.scratch.mit.edu`.',
	},
	servers: [
		{
			url: 'https://api.scratch.mit.edu',
			description: 'Production Scratch API server',
		},
	],
	paths: {
		'/projects/{id}': {
			put: {
				summary: 'Update Project Instructions or Notes and Credits',
				description:
					'Updates the instructions or notes and credits for a project.',
				parameters: [
					{
						in: 'path',
						name: 'id',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the project to update.',
					},
				],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: typia.json.schema<ProjectUpdateRequestBody>(),
						},
					},
				},
				responses: {
					'200': {
						description: 'Project updated successfully.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo>(),
							},
						},
					},
					'400': {
						description:
							'Bad Request (e.g., inappropriate content, text too long).',
					},
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
				},
			},
			get: {
				summary: 'Get Project Information',
				description: 'Retrieves detailed information about a specific project.',
				parameters: [
					{
						in: 'path',
						name: 'id',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the project.',
					},
				],
				responses: {
					'200': {
						description: 'Project details.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/projects': {
			get: {
				summary: "Get User's Shared Projects",
				description: 'Retrieves a list of projects shared by a specific user.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user.',
					},
					{
						in: 'query',
						name: 'limit',
						schema: typia.json.schema<number>(),
						description: 'Maximum number of projects to return.',
					},
					{
						in: 'query',
						name: 'offset',
						schema: typia.json.schema<number>(),
						description: 'Offset for pagination.',
					},
				],
				responses: {
					'200': {
						description: 'An array of project objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/favorites': {
			get: {
				summary: "Get User's Favorited Projects",
				description:
					'Retrieves a list of projects favorited by a specific user.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user.',
					},
					{
						in: 'query',
						name: 'limit',
						schema: typia.json.schema<number>(),
						description: 'Maximum number of projects to return.',
					},
					{
						in: 'query',
						name: 'offset',
						schema: typia.json.schema<number>(),
						description: 'Offset for pagination.',
					},
				],
				responses: {
					'200': {
						description: 'An array of favorited project objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/projects/recentlyviewed': {
			get: {
				summary: "Get User's Recently Viewed Projects",
				description:
					'Retrieves a list of projects recently viewed by the authenticated user.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user.',
					},
					{
						in: 'query',
						name: 'limit',
						schema: typia.json.schema<number>(),
						description: 'Maximum number of projects to return.',
					},
					{
						in: 'query',
						name: 'offset',
						schema: typia.json.schema<number>(),
						description: 'Offset for pagination.',
					},
				],
				responses: {
					'200': {
						description: 'An array of recently viewed project objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/classrooms/{classroomId}/projects': {
			get: {
				summary: 'Get Projects in a Classroom',
				description:
					'Retrieves a list of projects associated with a specific classroom.',
				parameters: [
					{
						in: 'path',
						name: 'classroomId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the classroom.',
					},
					{
						in: 'query',
						name: 'limit',
						schema: typia.json.schema<number>(),
						description: 'Maximum number of projects to return.',
					},
					{
						in: 'query',
						name: 'offset',
						schema: typia.json.schema<number>(),
						description: 'Offset for pagination.',
					},
				],
				responses: {
					'200': {
						description: 'An array of projects in the specified classroom.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/projects/{projectId}/comments/{parentId}/replies': {
			get: {
				summary: 'Get Replies to a Project Comment',
				description:
					'Retrieves replies for a specific top-level project comment.',
				parameters: [
					{
						in: 'path',
						name: 'projectId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the project.',
					},
					{
						in: 'path',
						name: 'parentId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the parent comment.',
					},
					{
						in: 'query',
						name: 'offset',
						schema: typia.json.schema<number>(),
						description: 'Offset for pagination.',
					},
					{
						in: 'query',
						name: 'limit',
						schema: typia.json.schema<number>(),
						description: 'Maximum number of replies to return.',
					},
				],
				responses: {
					'200': {
						description: 'An array of comment reply objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<Comment[]>(),
							},
						},
					},
				},
			},
		},
		'/projects/{id}/comments': {
			get: {
				summary: 'Get Top-Level Project Comments',
				description: 'Retrieves a list of top-level comments for a project.',
				parameters: [
					{
						in: 'path',
						name: 'id',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the project.',
					},
					{
						in: 'query',
						name: 'offset',
						schema: typia.json.schema<number>(),
						description: 'Offset for pagination.',
					},
					{
						in: 'query',
						name: 'limit',
						schema: typia.json.schema<number>(),
						description: 'Maximum number of comments to return.',
					},
				],
				responses: {
					'200': {
						description: 'An array of top-level comment objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<Comment[]>(),
							},
						},
					},
				},
			},
		},
		'/projects/{projectId}/comments/{commentId}': {
			get: {
				summary: 'Get Specific Project Comment',
				description: 'Retrieves a single project comment by its ID.',
				parameters: [
					{
						in: 'path',
						name: 'projectId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the project the comment belongs to.',
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the comment to retrieve.',
					},
				],
				responses: {
					'200': {
						description: 'A single comment object.',
						content: {
							'application/json': {
								schema: typia.json.schema<Comment>(),
							},
						},
					},
				},
			},
		},
		'/proxy/comments/project/{projectId}/comment/{commentId}': {
			delete: {
				summary: 'Delete a Project Comment (Proxied)',
				description:
					'Proxied endpoint to delete a specific comment on a project.',
				parameters: [
					{
						in: 'path',
						name: 'projectId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': { description: 'Comment deleted successfully.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/proxy/project/{projectId}/comment/{commentId}/report': {
			post: {
				summary: 'Report a Project Comment (Proxied)',
				description:
					'Proxied endpoint to report a specific comment on a project.',
				parameters: [
					{
						in: 'path',
						name: 'projectId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': { description: 'Comment reported successfully.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/proxy/admin/project/{projectId}/comment/{commentId}/undelete': {
			put: {
				summary: 'Restore a Deleted Project Comment (Admin Proxied)',
				description:
					'Proxied endpoint to restore a previously deleted project comment.',
				parameters: [
					{
						in: 'path',
						name: 'projectId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': { description: 'Comment restored successfully.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/studios/{studioId}/comments/{parentId}/replies': {
			get: {
				summary: 'Get Replies to a Studio Comment',
				description:
					'Retrieves replies for a specific top-level studio comment.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'parentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{ in: 'query', name: 'offset', schema: typia.json.schema<number>() },
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
				],
				responses: {
					'200': {
						description: 'An array of comment reply objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<Comment[]>(),
							},
						},
					},
				},
			},
		},
		'/studios/{id}/comments': {
			get: {
				summary: 'Get Top-Level Studio Comments',
				description: 'Retrieves a list of top-level comments for a studio.',
				parameters: [
					{
						in: 'path',
						name: 'id',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{ in: 'query', name: 'offset', schema: typia.json.schema<number>() },
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
				],
				responses: {
					'200': {
						description: 'An array of top-level comment objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<Comment[]>(),
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}/comments/{commentId}': {
			get: {
				summary: 'Get Specific Studio Comment',
				description: 'Retrieves a single studio comment by its ID.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': {
						description: 'A single comment object.',
						content: {
							'application/json': {
								schema: typia.json.schema<Comment>(),
							},
						},
					},
				},
			},
		},
		'/proxy/comments/studio/{studioId}/comment/{commentId}': {
			delete: {
				summary: 'Delete a Studio Comment (Proxied)',
				description:
					'Proxied endpoint to delete a specific comment in a studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': { description: 'Comment deleted successfully.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/proxy/studio/{studioId}/comment/{commentId}/report': {
			post: {
				summary: 'Report a Studio Comment (Proxied)',
				description:
					'Proxied endpoint to report a specific comment in a studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': { description: 'Comment reported successfully.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/proxy/admin/studio/{studioId}/comment/{commentId}/undelete': {
			put: {
				summary: 'Restore a Deleted Studio Comment (Admin Proxied)',
				description:
					'Proxied endpoint to restore a previously deleted studio comment.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'commentId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': { description: 'Comment restored successfully.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/studios/{studioId}/managers/': {
			get: {
				summary: 'Get Studio Managers',
				description: 'Retrieves a list of managers for a specific studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
					{ in: 'query', name: 'offset', schema: typia.json.schema<number>() },
				],
				responses: {
					'200': {
						description: 'An array of studio manager objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<StudioMember[]>(),
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}/curators/': {
			get: {
				summary: 'Get Studio Curators',
				description: 'Retrieves a list of curators for a specific studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
					{ in: 'query', name: 'offset', schema: typia.json.schema<number>() },
				],
				responses: {
					'200': {
						description: 'An array of studio curator objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<StudioMember[]>(),
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}/transfer/{newHostName}': {
			put: {
				summary: 'Transfer Studio Host',
				description:
					'Transfers the host role of a studio to another manager. Requires password for confirmation.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'newHostName',
						required: true,
						schema: typia.json.schema<string>(),
					},
				],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: typia.json.schema<{ password: string }>(),
						},
					},
				},
				responses: {
					'200': { description: 'Studio host transferred successfully.' },
					'401': {
						description:
							'Unauthorized (e.g., incorrect password, too many attempts).',
					},
					'409': { description: 'Conflict (e.g., user cannot become host).' },
				},
			},
		},
		'/studios/{studioId}/activity/': {
			get: {
				summary: 'Get Studio Activity',
				description:
					'Retrieves a list of recent activities for a specific studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
					{
						in: 'query',
						name: 'dateLimit',
						schema: typia.json.schema<string>(),
					},
				],
				responses: {
					'200': {
						description: 'An array of studio activity objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<unknown[]>(), // Activity items can be diverse
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}': {
			get: {
				summary: 'Get Studio Information',
				description: 'Retrieves basic information about a specific studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': {
						description: 'Studio details.',
						content: {
							'application/json': {
								schema: typia.json.schema<StudioInfo>(),
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}/users/{username}': {
			get: {
				summary: "Get User's Role in a Studio",
				description:
					'Retrieves the roles (manager, curator, follower, invited) of a specific user in a studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
					},
				],
				responses: {
					'200': {
						description: "User's role details in the studio.",
						content: {
							'application/json': {
								schema: typia.json.schema<StudioUserRole>(),
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}/classroom': {
			get: {
				summary: 'Get Classroom Info for a Studio',
				description:
					'Retrieves details of the classroom associated with a specific studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': {
						description: 'Classroom details associated with the studio.',
						content: {
							'application/json': {
								schema: typia.json.schema<ClassroomInfo>(),
							},
						},
					},
				},
			},
		},
		'/search/{itemType}': {
			get: {
				summary: 'Search Projects or Studios',
				description:
					'Performs a search for projects or studios based on a query and various filters.',
				parameters: [
					{
						in: 'path',
						name: 'itemType',
						required: true,
						schema: typia.json.schema<'projects' | 'studios'>(),
						description: 'The type of items to search for.',
					},
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
					{ in: 'query', name: 'offset', schema: typia.json.schema<number>() },
					{
						in: 'query',
						name: 'language',
						schema: typia.json.schema<string>(),
					},
					{
						in: 'query',
						name: 'mode',
						schema: typia.json.schema<'trending' | 'popular' | 'recent'>(),
					},
					{ in: 'query', name: 'q', schema: typia.json.schema<string>() },
				],
				responses: {
					'200': {
						description:
							'An array of search result objects (projects or studios).',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(), // Assuming common structure
							},
						},
					},
				},
			},
		},
		'/users/{username}/following/users/activity': {
			get: {
				summary: 'Get Activity of Users Followed by a User',
				description:
					'Retrieves a list of recent activities from users followed by the specified user.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
					},
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
				],
				responses: {
					'200': {
						description: 'An array of activity objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<unknown[]>(), // Activity items can be diverse
							},
						},
					},
				},
			},
		},
		'/proxy/featured': {
			get: {
				summary: 'Get Featured Content (Proxied)',
				description:
					'Proxied endpoint to retrieve various featured content sections (e.g., projects, studios).',
				responses: {
					'200': {
						description: 'Featured content object.',
						content: {
							'application/json': {
								schema: typia.json.schema<FeaturedContentResponse>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/following/users/projects': {
			get: {
				summary: 'Get Projects Shared by Users Followed by a User',
				description:
					'Retrieves projects recently shared by users that the specified user is following.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
					},
				],
				responses: {
					'200': {
						description: 'An array of project objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/following/studios/projects': {
			get: {
				summary: 'Get Projects in Studios Followed by a User',
				description:
					'Retrieves projects from studios that the specified user is following.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
					},
				],
				responses: {
					'200': {
						description: 'An array of project objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/following/users/loves': {
			get: {
				summary: 'Get Projects Loved by Users Followed by a User',
				description:
					'Retrieves projects recently loved by users that the specified user is following.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
					},
				],
				responses: {
					'200': {
						description: 'An array of project objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/accounts/checkusername/{username}/': {
			get: {
				summary: 'Check Username Availability',
				description:
					'Checks if a given username is available or violates any rules.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
					},
				],
				responses: {
					'200': {
						description: 'Username check status message.',
						content: {
							'application/json': {
								schema: typia.json.schema<{ msg: string }>(),
							},
						},
					},
				},
			},
		},
		'/accounts/checkpassword': {
			post: {
				summary: 'Check Password Strength',
				description: 'Checks the strength and validity of a given password.',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: typia.json.schema<{ password: string }>(),
						},
					},
				},
				responses: {
					'200': {
						description: 'Password strength status message.',
						content: {
							'application/json': {
								schema: typia.json.schema<{ msg: string }>(),
							},
						},
					},
				},
			},
		},
		'/accounts/check_email/': {
			get: {
				summary: 'Check Email Availability',
				description:
					'Checks if an email address is valid and available for use with Scratch.',
				parameters: [
					{
						in: 'query',
						name: 'email',
						required: true,
						schema: typia.json.schema<string>(),
					},
				],
				responses: {
					'200': {
						description: 'Email availability status message.',
						content: {
							'application/json': {
								schema: typia.json.schema<[{ msg: string }]>(), // Array inferred from original code
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}/projects/': {
			get: {
				summary: 'Get Projects in a Studio',
				description: 'Retrieves a list of projects added to a specific studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{ in: 'query', name: 'limit', schema: typia.json.schema<number>() },
					{ in: 'query', name: 'offset', schema: typia.json.schema<number>() },
				],
				responses: {
					'200': {
						description: 'An array of project objects in the studio.',
						content: {
							'application/json': {
								schema: typia.json.schema<ProjectInfo[]>(),
							},
						},
					},
				},
			},
		},
		'/studios/{studioId}/project/{projectId}': {
			post: {
				summary: 'Add Project to Studio',
				description: 'Adds a specified project to a studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'projectId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': {
						description: 'Project added to studio successfully.',
						content: {
							'application/json': {
								schema: typia.json.schema<{
									projectId: number
									actorId: number
								}>(),
							},
						},
					},
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
					'404': { description: 'Not Found (e.g., unknown project ID).' },
					'409': { description: 'Conflict (e.g., project already in studio).' },
					'429': { description: 'Too Many Requests (rate limit exceeded).' },
				},
			},
			delete: {
				summary: 'Remove Project from Studio',
				description: 'Removes a specified project from a studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
					},
					{
						in: 'path',
						name: 'projectId',
						required: true,
						schema: typia.json.schema<number>(),
					},
				],
				responses: {
					'200': { description: 'Project removed from studio.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
	},
})
