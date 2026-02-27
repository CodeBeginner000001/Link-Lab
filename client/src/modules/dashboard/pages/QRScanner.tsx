import { ScanLine } from "lucide-react"
import Heading from "../component/common/Heading"

const QRScanner = () => {
  return (
    <div className="space-y-6">
      <Heading icon={ScanLine} heading="QR Code Scanner" para="Instantly scan and decode QR codes from images." iconClassName="w-6 h-6 text-primary"/>
    </div>
  )
}

export default QRScanner
