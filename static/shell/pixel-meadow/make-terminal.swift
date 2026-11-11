import AppKit
import CoreText
import Foundation

// Generates an importable Terminal.app profile; does not change preferences.
let fontURL = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Fonts/Monocraft.ttc")
CTFontManagerRegisterFontsForURL(fontURL as CFURL, .process, nil)
guard let font = NSFont(name: "Monocraft", size: 16) ?? NSFont(name: "Monocraft-Regular", size: 16) else {
    fputs("Install font-monocraft before generating this profile.\n", stderr)
    exit(1)
}
func archive(_ value: Any) throws -> Data {
    try NSKeyedArchiver.archivedData(withRootObject: value, requiringSecureCoding: false)
}
func color(_ hex: String) -> NSColor {
    let rgb = UInt32(hex, radix: 16)!
    return NSColor(srgbRed: CGFloat((rgb >> 16) & 255) / 255,
                   green: CGFloat((rgb >> 8) & 255) / 255,
                   blue: CGFloat(rgb & 255) / 255, alpha: 1)
}
var profile: [String: Any] = [
    "name": "Pixel Meadow", "type": "Window Settings", "ProfileCurrentVersion": 2.09,
    "Font": try archive(font), "FontAntialias": false, "FontWidthSpacing": 1.0,
    "columnCount": 110, "rowCount": 32, "CursorType": 0, "CursorBlink": false,
    "UseBoldFonts": true, "UseBrightBold": false, "BackgroundAlpha": 1.0,
    "OptionAsMetaKey": true, "TerminalType": "xterm-256color",
]
let colors = [
    "BackgroundColor": "141d19", "TextColor": "d9e4d5", "TextBoldColor": "f1f7ed",
    "CursorColor": "a3e08c", "SelectionColor": "344e3d",
    "ANSIBlackColor": "141d19", "ANSIRedColor": "ed8796", "ANSIGreenColor": "a3e08c",
    "ANSIYellowColor": "eed49f", "ANSIBlueColor": "8aadf4", "ANSIMagentaColor": "c6a0f6",
    "ANSICyanColor": "91d7e3", "ANSIWhiteColor": "d9e4d5",
    "ANSIBrightBlackColor": "789080", "ANSIBrightRedColor": "f5a9b5",
    "ANSIBrightGreenColor": "bdf2a8", "ANSIBrightYellowColor": "f6e2b8",
    "ANSIBrightBlueColor": "aec8ff", "ANSIBrightMagentaColor": "dec1ff",
    "ANSIBrightCyanColor": "b1eff5", "ANSIBrightWhiteColor": "f1f7ed",
]
for (key, hex) in colors { profile[key] = try archive(color(hex)) }
let output = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "Pixel Meadow.terminal"
let data = try PropertyListSerialization.data(fromPropertyList: profile, format: .xml, options: 0)
try data.write(to: URL(fileURLWithPath: output), options: .atomic)
print("Generated \(output), font=\(font.fontName), size=\(font.pointSize)")
