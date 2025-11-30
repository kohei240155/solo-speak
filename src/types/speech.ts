// Speech API Types

export interface SentenceData {
	learningLanguage: string;
	nativeLanguage: string;
}

export interface FeedbackData {
	category: string;
	content: string;
}

export interface SaveSpeechRequestBody {
	title: string;
	learningLanguageId: string;
	nativeLanguageId: string;
	firstSpeechText: string;
	notes?: string;
	speechPlans: string[];
	sentences: SentenceData[];
	feedback: FeedbackData[];
}

export interface SaveSpeechResponseData {
	success: true;
	speech: {
		id: string;
		title: string;
		learningLanguage: {
			id: string;
			name: string;
			code: string;
		};
		nativeLanguage: {
			id: string;
			name: string;
			code: string;
		};
		firstSpeechText: string;
		audioFilePath?: string;
		notes?: string;
		status: {
			id: string;
			name: string;
			description?: string;
		};
		practiceCount: number;
		createdAt: string;
		updatedAt: string;
	};
	phrases: Array<{
		id: string;
		original: string;
		translation: string;
		speechOrder: number;
		createdAt: string;
	}>;
	speechPlans: Array<{
		id: string;
		planningContent: string;
		createdAt: string;
	}>;
	feedbacks: Array<{
		id: string;
		category: string;
		content: string;
		createdAt: string;
	}>;
}

export interface RemainingSpeechCountResponse {
	remainingSpeechCount: number;
}

// Speech List Types
export interface SpeechStatus {
	id: string;
	name: string;
	description?: string;
}

export interface SpeechListItem {
	id: string;
	title: string;
	firstPhrase: {
		original: string;
	};
	practiceCount: number;
	status: SpeechStatus;
	lastPracticedAt: string | null;
	createdAt: string;
}

export interface PaginationData {
	total: number;
	limit: number;
	page: number;
	hasMore: boolean;
}

export interface SpeechListResponseData {
	success: true;
	speeches: SpeechListItem[];
	pagination: PaginationData;
}

// Speech Detail Types
export interface SpeechDetailResponse {
	id: string;
	title: string;
	phrases: Array<{
		id: string;
		original: string;
		translation: string;
		speechOrder: number;
	}>;
}

export interface UpdateSpeechRequest {
	title: string;
	phrases: Array<{
		phraseId: string;
		original: string;
		translation: string;
	}>;
}

// Speech Review Types
export interface SpeechReviewResponseData {
	success: true;
	speech: {
		id: string;
		title: string;
		practiceCount: number;
		status: {
			id: string;
			name: string;
			description?: string;
		};
		nativeLanguage: {
			id: string;
			code: string;
			name: string;
		};
		learningLanguage: {
			id: string;
			code: string;
			name: string;
		};
		firstSpeechText: string;
		audioFilePath: string | null;
		notes: string | null;
		lastPracticedAt: string | null;
		createdAt: string;
		phrases: Array<{
			id: string;
			original: string;
			translation: string;
			speechOrder: number;
		}>;
		feedbacks: Array<{
			id: string;
			category: string;
			content: string;
			createdAt: string;
		}>;
	} | null;
}

// Speech Status Update Types
export interface UpdateSpeechStatusRequest {
	statusId: string;
}

export interface UpdateSpeechStatusResponse {
	message: string;
	speech: {
		id: string;
		status: {
			id: string;
			name: string;
			description: string | null;
		};
	};
}

// Speech Notes Update Types
export interface UpdateSpeechNotesRequest {
	notes: string;
}

export interface UpdateSpeechNotesResponse {
	message: string;
	speech: {
		id: string;
		notes: string;
	};
}

// Speech Practice Record Types
export interface RecordPracticeResponse {
	message: string;
	speech: {
		id: string;
		practiceCount: number;
		lastPracticedAt: Date | null;
	};
}
