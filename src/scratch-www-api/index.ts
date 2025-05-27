// scratch-www-api.ts
import { typiaToOpenAPI } from '@pnsk-lab/typia-openapi'
import typia from 'typia'
import type { ClassroomInfo } from '../shared'

// --- Type Definitions for API Payloads and Responses ---

// Request Bodies
interface LoginRequestBody {
	username: string
	password: string
	useMessages?: boolean // Optional, defaults to false if not provided
}

interface DeleteAdminMessageRequestBody {
	alertType: 'invite' | 'notification'
	alertId: number
}

// Responses
interface SuccessResponse {
	success: boolean
	redirect?: string
	msg?: string
	messages?: Array<Record<string, unknown>> // More specific type if message structure is known
	errors?: Record<string, string[]> // For registration errors
}

interface UserMessage {
	id: number
	type: string // e.g., 'followuser', 'loveproject', 'addcomment'
	datetime_created: string // ISO 8601 string
	// Add more specific fields based on message.type
	actor_username?: string
	project_id?: number
	project_title?: string
	comment_id?: number
	comment_fragment?: string
	comment_obj_id?: number
	comment_obj_title?: string
	comment_type?: number // 0 for project, 1 for user, 2 for studio
	follower_username?: string
	studio_id?: number
	studio_title?: string
	topic_id?: number
	topic_title?: string
	recipient_username?: string
	admin_actor?: boolean
}

interface AdminMessage {
	id: number
	message: string
	datetime_created: string // ISO 8601 string
}

interface ScratcherInvite {
	id: number
	datetime_created: string // ISO 8601 string
}

interface StudioUpdateResponse {
	title?: string
	description?: string
	thumbnail_url?: string
}

interface StudioErrors {
	errors?: string[] // Specific error messages from the server, e.g., "inappropriate-generic"
}

interface StudioBasicInfo {
	id: number
	title: string
	description: string
	image: string
	open_to_all: boolean
	comments_allowed: boolean
	history: Record<string, unknown>
	stats: Record<string, number>
	host: number
	public: boolean
	classroomId?: number
}

interface UserSession {
	user?: {
		id: number
		username: string
		email?: string
		token?: string
		thumbnailUrl?: string
		dateJoined?: string
		classroomId?: string
		banned?: boolean
	}
	permissions?: {
		admin?: boolean
		social?: boolean
		educator?: boolean
		educator_invitee?: boolean
		student?: boolean
		mute_status?: {
			muteExpiresAt: number // Unix timestamp in seconds
			offenses: unknown[] // Array of offense objects
			currentMessageType?: string
			showWarning?: boolean
		}
	}
	flags?: {
		must_reset_password?: boolean
		must_complete_registration?: boolean
		has_outstanding_email_confirmation?: boolean
		show_welcome?: boolean
		confirm_email_banner?: boolean
		unsupported_browser_banner?: boolean
		with_parent_email?: boolean
	}
	banned?: boolean
	vpn_required?: boolean
	redirectURL?: string
}

interface RegistrationRequest {
	username?: string
	password?: string
	birth_month?: string
	birth_year?: string
	gender?: string
	country?: string
	is_robot?: boolean
	'g-recaptcha-response'?: string
	email?: string
	first_name?: string
	last_name?: string
	phone_number?: string
	organization_name?: string
	organization_title?: string
	organization_type?: string
	organization_other?: string
	organization_url?: string
	address_country?: string
	address_line1?: string
	address_line2?: string
	address_city?: string
	address_state?: string
	address_zip?: string
	how_use_scratch?: string
	classroom_id?: number
	classroom_token?: string
	subscribe?: boolean
}

interface RegistrationResponse {
	success: boolean
	msg?: string
	redirect?: string
	errors?: Record<string, string[]>
	status?: {
		mute_status?: {
			muteExpiresAt: number
			offenses: unknown[]
			currentMessageType?: string
			showWarning?: boolean
		}
	}
}

interface NewsPost {
	id: number
	headline: string
	copy: string
	url: string
	image: string
}

interface YoutubeVideoData {
	videoId: string
	title: string
	thumbnail: string
	channel: string
	uploadTime: string
	length: string
	views: string
	hasCC: boolean
}

export default typiaToOpenAPI({
	openapi: '3.0.0',
	info: {
		title: 'Scratch WWW API',
		version: '1.0.0',
		description:
			'API endpoints for core website functionalities, authentication, messaging, and site-level content management, primarily serving the `scratch.mit.edu` domain. Includes endpoints that function as proxies for other services.',
	},
	servers: [
		{
			url: 'https://scratch.mit.edu',
			description: 'Production Scratch website and API proxy',
		},
	],
	paths: {
		'/accounts/login/': {
			post: {
				summary: 'User Login',
				description: 'Authenticates a user with a username and password.',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: typia.json.schema<LoginRequestBody>(),
						},
					},
				},
				responses: {
					'200': {
						description: 'Login successful, redirect, or error message.',
						content: {
							'application/json': {
								schema: typia.json.schema<[SuccessResponse]>(), // Array wrapper inferred from original code
							},
						},
					},
					'302': {
						description:
							'Redirect after successful login (if not handled by JSON response).',
					},
				},
			},
		},
		'/accounts/logout/': {
			post: {
				summary: 'User Logout',
				description:
					'Logs out the current user, often via a form submission for CSRF.',
				requestBody: {
					required: true,
					content: {
						'application/x-www-form-urlencoded': {
							schema: typia.json.schema<{ csrfmiddlewaretoken: string }>(),
						},
					},
				},
				responses: {
					'302': { description: 'Redirect after logout.' },
				},
			},
		},
		'/site-api/messages/messages-clear/': {
			post: {
				summary: 'Clear Unread Message Count',
				description:
					'Clears the unread message count for the authenticated user.',
				responses: {
					'200': {
						description: 'Message count cleared successfully.',
						content: {
							'application/json': {
								schema: typia.json.schema<{ success: boolean }>(),
							},
						},
					},
				},
			},
		},
		'/site-api/messages/messages-delete/': {
			post: {
				summary: 'Delete Admin Message',
				description:
					'Deletes a specific admin message or notification for the user.',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: typia.json.schema<DeleteAdminMessageRequestBody>(),
						},
					},
				},
				responses: {
					'200': {
						description: 'Admin message deleted successfully.',
						content: {
							'application/json': {
								schema: typia.json.schema<{ success: boolean }>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/messages': {
			get: {
				summary: 'Get User Messages',
				description: 'Retrieves a list of social messages for a given user.',
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
						description: 'Maximum number of messages to return.',
					},
					{
						in: 'query',
						name: 'offset',
						schema: typia.json.schema<number>(),
						description: 'Offset for pagination.',
					},
					{
						in: 'query',
						name: 'filter',
						schema: typia.json.schema<
							'all' | 'comments' | 'projects' | 'studios' | 'forums' | ''
						>(),
						description: 'Filter messages by type.',
					},
					{
						in: 'query',
						name: 'language',
						schema: typia.json.schema<string>(),
						description: 'Preferred language for messages.',
					},
				],
				responses: {
					'200': {
						description: 'An array of user message objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<UserMessage[]>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/messages/admin': {
			get: {
				summary: 'Get Admin Messages for a User',
				description:
					'Retrieves messages from the Scratch Team for a specific user.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user.',
					},
				],
				responses: {
					'200': {
						description: 'An array of admin message objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<AdminMessage[]>(),
							},
						},
					},
				},
			},
		},
		'/users/{username}/invites': {
			get: {
				summary: 'Get Scratcher Invitation Status',
				description:
					'Checks if a user has an invitation to become a Scratcher.',
				parameters: [
					{
						in: 'path',
						name: 'username',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user.',
					},
				],
				responses: {
					'200': {
						description: 'Scratcher invite object.',
						content: {
							'application/json': {
								schema: typia.json.schema<ScratcherInvite>(),
							},
						},
					},
				},
			},
		},
		'/site-api/galleries/all/{studioId}/': {
			put: {
				summary: 'Update Studio Title or Description',
				description: "Allows a studio's title or description to be updated.",
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio to update.',
					},
				],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: typia.json.schema<{
								title?: string
								description?: string
							}>(),
						},
					},
				},
				responses: {
					'200': {
						description: 'Studio updated successfully.',
						content: {
							'application/json': {
								schema: typia.json.schema<StudioUpdateResponse>(),
							},
						},
					},
					'400': {
						description:
							'Bad Request (e.g., inappropriate content, text too long, required field).',
					},
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
				},
			},
			post: {
				summary: 'Update Studio Thumbnail',
				description: "Allows a studio's thumbnail image to be updated.",
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description:
							'The ID of the studio whose thumbnail is to be updated.',
					},
				],
				requestBody: {
					required: true,
					content: {
						'multipart/form-data': {
							schema: typia.json.schema<{
								file: string /* This represents a File object in runtime */
							}>(),
						},
					},
				},
				responses: {
					'200': {
						description: 'Studio image updated successfully.',
						content: {
							'application/json': {
								schema: typia.json.schema<StudioUpdateResponse>(),
							},
						},
					},
					'400': {
						description:
							'Bad Request (e.g., thumbnail too large, image invalid).',
					},
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/site-api/users/bookmarkers/{studioId}/add/': {
			put: {
				summary: 'Follow a Studio',
				description:
					'Adds the authenticated user as a follower of the specified studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio to follow.',
					},
					{
						in: 'query',
						name: 'usernames',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user to add as a follower.',
					},
				],
				responses: {
					'200': { description: 'Studio followed successfully.' },
					'403': { description: 'Forbidden (e.g., email not confirmed).' },
				},
			},
		},
		'/site-api/users/bookmarkers/{studioId}/remove/': {
			put: {
				summary: 'Unfollow a Studio',
				description:
					'Removes the authenticated user as a follower of the specified studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio to unfollow.',
					},
					{
						in: 'query',
						name: 'usernames',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user to remove as a follower.',
					},
				],
				responses: {
					'200': { description: 'Studio unfollowed successfully.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/site-api/comments/gallery/{studioId}/toggle-comments/': {
			post: {
				summary: 'Toggle Studio Comments',
				description:
					'Toggles whether comments are allowed on a specific studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio.',
					},
				],
				responses: {
					'200': { description: 'Studio comments toggled successfully.' },
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
				},
			},
		},
		'/site-api/galleries/{studioId}/mark/open/': {
			put: {
				summary: 'Set Studio to Open to All',
				description:
					'Sets the specified studio to allow anyone to add projects.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio.',
					},
				],
				responses: {
					'200': { description: 'Studio set to open to all.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/site-api/galleries/{studioId}/mark/closed/': {
			put: {
				summary: 'Set Studio to Closed',
				description:
					'Sets the specified studio to only allow managers/curators to add projects.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio.',
					},
				],
				responses: {
					'200': { description: 'Studio set to closed.' },
					'403': { description: 'Forbidden (e.g., insufficient permissions).' },
				},
			},
		},
		'/site-api/users/curators-in/{studioId}/remove/': {
			put: {
				summary: 'Remove Curator or Manager from Studio',
				description:
					'Removes a user from the curator or manager role in a studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio.',
					},
					{
						in: 'query',
						name: 'usernames',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user to remove.',
					},
				],
				responses: {
					'200': { description: 'User removed from studio role.' },
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
				},
			},
		},
		'/site-api/users/curators-in/{studioId}/invite_curator/': {
			put: {
				summary: 'Invite Curator to Studio',
				description:
					'Invites a user to become a curator of the specified studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio.',
					},
					{
						in: 'query',
						name: 'usernames',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user to invite.',
					},
				],
				responses: {
					'200': { description: 'Curator invited to studio.' },
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
					'404': { description: 'Not Found (e.g., unknown username).' },
					'409': { description: 'Conflict (e.g., user is already a curator).' },
					'429': { description: 'Too Many Requests (rate limit exceeded).' },
				},
			},
		},
		'/site-api/users/curators-in/{studioId}/promote/': {
			put: {
				summary: 'Promote Curator to Manager',
				description:
					'Promotes an existing curator to a manager role in the specified studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio.',
					},
					{
						in: 'query',
						name: 'usernames',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the curator to promote.',
					},
				],
				responses: {
					'200': { description: 'Curator promoted to manager.' },
					'400': { description: 'Bad Request (e.g., manager limit reached).' },
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
				},
			},
		},
		'/site-api/users/curators-in/{studioId}/add/': {
			put: {
				summary: 'Accept Curator Invitation for Studio',
				description:
					'Allows a user to accept an invitation to become a curator of a studio.',
				parameters: [
					{
						in: 'path',
						name: 'studioId',
						required: true,
						schema: typia.json.schema<number>(),
						description: 'The ID of the studio.',
					},
					{
						in: 'query',
						name: 'usernames',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The username of the user accepting the invite.',
					},
				],
				responses: {
					'200': { description: 'Curator invitation accepted.' },
					'403': {
						description:
							'Forbidden (e.g., insufficient permissions, user muted).',
					},
				},
			},
		},
		'/news': {
			get: {
				summary: 'Get Latest News Posts',
				description:
					'Retrieves a list of recent news posts from the Scratch website.',
				parameters: [
					{
						in: 'query',
						name: 'limit',
						schema: typia.json.schema<number>(),
						description: 'Maximum number of news posts to return.',
					},
				],
				responses: {
					'200': {
						description: 'An array of news post objects.',
						content: {
							'application/json': {
								schema: typia.json.schema<NewsPost[]>(),
							},
						},
					},
				},
			},
		},
		'/scratch_admin/homepage/clear-cache/': {
			post: {
				summary: 'Clear Homepage Cache (Admin Only)',
				description:
					'Triggers a cache clear for the homepage, accessible only by administrators.',
				responses: {
					'200': {
						description: 'Cache clear status.',
						content: {
							'application/json': {
								schema: typia.json.schema<{ success: boolean }>(),
							},
						},
					},
				},
			},
		},
		'/site-api/users/set-template-cue/': {
			post: {
				summary: 'Set User Template Cue',
				description:
					'Sets a template cue (e.g., dismiss banners) for the authenticated user.',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: typia.json.schema<{ cue: string; value: boolean }>(),
						},
					},
				},
				responses: {
					'200': { description: 'Template cue set successfully.' },
				},
			},
		},
		'/session/': {
			get: {
				summary: 'Get User Session Information',
				description:
					'Retrieves detailed session information for the current user, including user data, permissions, and feature flags.',
				responses: {
					'200': {
						description: 'User session details.',
						content: {
							'application/json': {
								schema: typia.json.schema<UserSession>(),
							},
						},
					},
				},
			},
		},
		'/classtoken/{classroomToken}': {
			get: {
				summary: 'Get Classroom Info by Token',
				description:
					'Retrieves classroom details using a unique classroom token.',
				parameters: [
					{
						in: 'path',
						name: 'classroomToken',
						required: true,
						schema: typia.json.schema<string>(),
						description: 'The unique token for the classroom.',
					},
				],
				responses: {
					'200': {
						description: 'Classroom details.',
						content: {
							'application/json': {
								schema: typia.json.schema<ClassroomInfo>(),
							},
						},
					},
					'404': { description: 'Classroom not found for the given token.' },
				},
			},
		},
		'/classes/register_new_student/': {
			post: {
				summary: 'Register New Student in Classroom',
				description:
					'Registers a new student account linked to a specific classroom.',
				requestBody: {
					required: true,
					content: {
						'application/x-www-form-urlencoded': {
							schema: typia.json.schema<RegistrationRequest>(), // Use a more general type for registration, as fields vary
						},
					},
				},
				responses: {
					'200': {
						description: 'Student registration status.',
						content: {
							'application/json': {
								schema: typia.json.schema<[RegistrationResponse]>(),
							},
						},
					},
				},
			},
		},
		'/classes/student_update_registration/': {
			post: {
				summary: 'Update Student Registration Info',
				description:
					'Updates personal information for an existing student account.',
				requestBody: {
					required: true,
					content: {
						'application/x-www-form-urlencoded': {
							schema: typia.json.schema<RegistrationRequest>(),
						},
					},
				},
				responses: {
					'200': {
						description: 'Student registration update status.',
						content: {
							'application/json': {
								schema: typia.json.schema<[RegistrationResponse]>(),
							},
						},
					},
				},
			},
		},
		'/scratchr2/static/sa/{path}': {
			get: {
				summary: 'Get Scratch 2.0 Offline Editor Version XML',
				description:
					'Retrieves version information for the Scratch 2.0 Offline Editor, served as an XML file.',
				parameters: [
					{
						in: 'path',
						name: 'path',
						required: true,
						schema: typia.json.schema<'version.xml' | 'pt-br/version.xml'>(),
						description: 'Path to the version XML file.',
					},
				],
				responses: {
					'200': {
						description: 'XML content with version info.',
						content: {
							'application/xml': {
								schema: typia.json.schema<string>(), // XML content as string
							},
						},
					},
				},
			},
		},
		'/ideas/videos/{playlistKey}': {
			get: {
				summary: 'Proxy to YouTube Playlist Videos',
				description:
					'This endpoint serves as an internal proxy on the Scratch WWW server to fetch video data from YouTube playlists. The actual YouTube API is called server-side from Scratch.',
				parameters: [
					{
						in: 'path',
						name: 'playlistKey',
						required: true,
						schema: typia.json.schema<
							'sprites-and-vectors' | 'tips-and-tricks' | 'advanced-topics'
						>(),
						description: 'Identifier for the YouTube playlist.',
					},
				],
				responses: {
					'200': {
						description: 'Array of video objects from the playlist.',
						content: {
							'application/json': {
								schema: typia.json.schema<YoutubeVideoData[]>(),
							},
						},
					},
				},
			},
		},
	},
})
