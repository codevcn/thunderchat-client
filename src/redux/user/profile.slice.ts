import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { profileService } from "@/services/profile.service"

import type { PayloadAction } from "@reduxjs/toolkit"

export const fetchProfile = createAsyncThunk("profile/fetch", async () => {
  return await profileService.getProfile()
})

// Định nghĩa type cho profile update
type ProfileUpdatePayload = {
  fullName?: string
  birthday?: string
  about?: string
  avatar?: string
}

export const updateProfileThunk = createAsyncThunk(
  "profile/update",
  async (profileData: ProfileUpdatePayload) => {
    return await profileService.updateProfile(profileData)
  }
)

const profileSlice = createSlice({
  name: "profile",
  initialState: { data: null, loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.data = action.payload
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.data = action.payload
      })
  },
})

export default profileSlice.reducer
