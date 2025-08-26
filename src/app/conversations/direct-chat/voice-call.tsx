import { CustomTooltip } from "@/components/materials/tooltip"
import { IconButton } from "@/components/materials/icon-button"
import { Phone } from "lucide-react"

type TVoiceCallProps = {
  canSend: boolean
}

export const VoiceCall = ({ canSend }: TVoiceCallProps) => {
  return (
    <CustomTooltip title="Call" placement="bottom" align="end">
      <div className={`${canSend === false ? "pointer-events-none cursor-not-allowed" : ""}`}>
        <IconButton className="flex justify-center items-center text-regular-icon-cl w-[40px] h-[40px]">
          <Phone />
        </IconButton>
      </div>
    </CustomTooltip>
  )
}
