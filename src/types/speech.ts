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
	practiceCount: number;
	status: SpeechStatus;
	createdAt: string;
}
