import { useRef, useState, useEffect } from "react"
import { CustomAvatar, toast } from "@/components/materials"
import AvatarCropperModal from "@/components/materials/avatar-cropper-modal"
import { uploadFile } from "@/apis/upload"
import { Pencil } from "lucide-react"

function toDateInputValue(dateString: string) {
  if (!dateString) return ""
  return dateString.slice(0, 10)
}

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  userProfile: any
  onSave: (data: {
    avatar: string | null
    fullname: string
    birthday: string
    about: string
  }) => void
}

const EditProfileModal = ({ open, onClose, userProfile, onSave }: EditProfileModalProps) => {
  const [avatar, setAvatar] = useState<string | null>(userProfile?.Profile.avatar || null)
  const [fullname, setFullname] = useState<string>(userProfile?.Profile.fullName || "")
  const [birthday, setBirthday] = useState<string>(userProfile?.Profile.birthday || "")
  const [about, setAbout] = useState<string>(userProfile?.Profile.about || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fullnameError, setFullnameError] = useState("")
  const [birthdayError, setBirthdayError] = useState("")

  useEffect(() => {
    if (userProfile) {
      setAvatar(userProfile.Profile.avatar || null)
      setFullname(userProfile.Profile.fullName || "")
      setBirthday(userProfile.Profile.birthday || "")
      setAbout(userProfile.Profile.about || "")
    }
  }, [userProfile])

  useEffect(() => {
    if (open && userProfile) {
      setAvatar(userProfile.Profile.avatar || null)
      setFullname(userProfile.Profile.fullName || "")
      setBirthday(userProfile.Profile.birthday || "")
      setAbout(userProfile.Profile.about || "")
      setFullnameError("")
      setBirthdayError("")
      // Nếu có các state crop, cũng reset luôn:
      setShowCropper(false)
      setSelectedImage(null)
      setUploading(false)
    }
  }, [open, userProfile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropConfirm = (croppedDataUrl: string) => {
    setAvatar(croppedDataUrl)
    setShowCropper(false)
    setSelectedImage(null)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setSelectedImage(null)
  }

  const validate = () => {
    let valid = true
    setFullnameError("")
    setBirthdayError("")

    if (!fullname.trim()) {
      setFullnameError("Full name cannot be empty")
      valid = false
    }
    if (birthday) {
      const birthDate = new Date(birthday)
      const now = new Date()
      const age =
        now.getFullYear() -
        birthDate.getFullYear() -
        (now < new Date(birthDate.setFullYear(now.getFullYear())) ? 1 : 0)
      if (age < 18) {
        setBirthdayError("You must be over 18 years old")
        valid = false
      }
    } else {
      setBirthdayError("Please select your date of birth")
      valid = false
    }
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    let avatarUrl = avatar
    if (avatar && avatar.startsWith("data:")) {
      setUploading(true)
      try {
        const response = await fetch(avatar)
        const blob = await response.blob()
        const file = new File([blob], `avatar-${Date.now()}.png`, { type: "image/png" })
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Avatar image cannot exceed 5MB!")
          setUploading(false)
          return
        }
        const { url } = await uploadFile(file)
        avatarUrl = url
      } catch (err) {
        toast.error("Error uploading avatar!")
        setUploading(false)
        return
      }
      setUploading(false)
    }
    onSave({ avatar: avatarUrl, fullname, birthday, about })
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#232526] rounded-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-white" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Edit Personal Information</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CustomAvatar
                src={avatar || "/images/user/default-avatar-black.webp"}
                imgSize={90}
                className="ring-2 ring-[#3A3B3C] shadow-lg rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Pencil size={28} color="#CFCFCF" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">Full Name</label>
            <input
              type="text"
              className={`w-full rounded-xl bg-[#2C2E31] border ${fullnameError ? "border-red-500" : "border-[#35363A]"} px-4 py-2 text-white`}
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
            {fullnameError && <div className="text-red-500 text-xs mt-1">{fullnameError}</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">Date of Birth</label>
            <input
              type="date"
              className={`w-full rounded-xl bg-[#2C2E31] border ${birthdayError ? "border-red-500" : "border-[#35363A]"} px-4 py-2 text-white`}
              value={toDateInputValue(birthday)}
              onChange={(e) => setBirthday(e.target.value)}
            />
            {birthdayError && <div className="text-red-500 text-xs mt-1">{birthdayError}</div>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#CFCFCF]">About Me</label>
            <textarea
              className="w-full rounded-xl bg-[#2C2E31] border border-[#35363A] px-4 py-2 text-white resize-none min-h-[60px]"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 transition text-white font-bold py-2.5 rounded-xl mt-2 shadow-lg shadow-violet-800/30"
          >
            Save Changes
          </button>
        </form>
        {/* Avatar cropper modal within edit modal */}
        {showCropper && selectedImage && (
          <AvatarCropperModal
            open={showCropper}
            image={selectedImage}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
            uploading={uploading}
          />
        )}
      </div>
    </div>
  )
}

export default EditProfileModal
