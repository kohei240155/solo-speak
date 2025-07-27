export interface Situation {
  id: string
  userId: string
  name: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface CreateSituationRequest {
  name: string
}

export interface SituationResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
