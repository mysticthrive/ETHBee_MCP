"use client"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Clock, MapPin } from "lucide-react"
import { TIMEZONE_GROUPS, getUserTimezone, formatTimeInTimezone, getTimezoneOffset } from "@/lib/utils/timezone-utils"

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  label?: string
  showCurrentTime?: boolean
  showDetectButton?: boolean
}

export function TimezoneSelector({
  value,
  onChange,
  label = "Timezone",
  showCurrentTime = true,
  showDetectButton = true,
}: TimezoneSelectorProps) {
  const [currentTime, setCurrentTime] = useState<string>("")
  const [detectedTimezone, setDetectedTimezone] = useState<string>("")

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      if (value) {
        setCurrentTime(
          formatTimeInTimezone(new Date(), value, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
        )
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [value])

  // Detect user's timezone on mount
  useEffect(() => {
    setDetectedTimezone(getUserTimezone())
  }, [])

  const handleDetectTimezone = () => {
    const detected = getUserTimezone()
    onChange(detected)
  }

  const getTimezoneLabel = (timezone: string) => {
    const option = Object.values(TIMEZONE_GROUPS)
      .flat()
      .find((tz) => tz.value === timezone)
    return option ? option.label : timezone
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="timezone" className="text-gray-400">
          {label}
        </Label>
        {showDetectButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDetectTimezone}
            className="text-yellow-400 hover:text-yellow-300 text-xs"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Auto-detect
          </Button>
        )}
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-black/40 border-gray-800 text-white">
          <SelectValue placeholder="Select timezone">
            {value && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                <span>{getTimezoneLabel(value)}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700 max-h-80">
          {Object.entries(TIMEZONE_GROUPS).map(([region, timezones]) => (
            <div key={region}>
              <div className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-800/50">{region}</div>
              {timezones.map((timezone) => (
                <SelectItem
                  key={timezone.value}
                  value={timezone.value}
                  className="text-white hover:bg-gray-800 focus:bg-gray-800"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{timezone.label}</span>
                    <span className="text-xs text-gray-400 ml-2">{getTimezoneOffset(timezone.value)}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {showCurrentTime && value && currentTime && (
        <div className="flex items-center text-sm text-gray-400">
          <Clock className="w-4 h-4 mr-2 text-yellow-400" />
          <span>Current time: {currentTime}</span>
        </div>
      )}

      {detectedTimezone && detectedTimezone !== value && (
        <div className="text-xs text-gray-500">Detected timezone: {getTimezoneLabel(detectedTimezone)}</div>
      )}
    </div>
  )
}
