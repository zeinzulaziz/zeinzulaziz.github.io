// Render app icons from the site favicon (deep ink plate, chalk "Z").
// Usage: swift tools/make-icon.swift <size> <output.png>
// The 180px output is the apple-touch-icon; 192/512 feed site.webmanifest.
import Foundation
import CoreGraphics
import CoreText
import ImageIO

let args = CommandLine.arguments
guard args.count == 3, let size = Int(args[1]) else {
    fatalError("usage: swift tools/make-icon.swift <size> <output.png>")
}
let outPath = args[2]

guard let ctx = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: size * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else { fatalError("context") }

// Deep ink plate (#080d16) with a chalk "Z" — same mark as the SVG favicon.
// The plate is opaque: iOS applies its own rounded mask and flattens any
// transparency to black, so a see-through icon would look wrong.
ctx.setFillColor(CGColor(red: 0.031, green: 0.051, blue: 0.086, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

// One copper dot, the site's identity mark, in the upper right.
let dot = CGFloat(size) * 0.072
ctx.setFillColor(CGColor(red: 0.847, green: 0.647, blue: 0.475, alpha: 1))
ctx.fillEllipse(in: CGRect(x: CGFloat(size) * 0.72, y: CGFloat(size) * 0.72,
                           width: dot, height: dot))

// Centered "Z" in chalk (#ede6d9), sized relative to the canvas.
let font = "HelveticaNeue-Bold" as CFString
let fontSize = CGFloat(size) * 0.62
guard let f = CTFontCreateWithName(font, fontSize, nil) as CTFont? else { fatalError("font") }
let text = "Z" as CFString
let attrs: [String: Any] = [kCTFontAttributeName as String: f,
                            kCTForegroundColorAttributeName as String:
                                CGColor(red: 0.929, green: 0.902, blue: 0.851, alpha: 1)]
guard let attr = CFAttributedStringCreate(nil, text, attrs as CFDictionary) else { fatalError("attrs") }
let line = CTLineCreateWithAttributedString(attr)
var ascent: CGFloat = 0, descent: CGFloat = 0, leading: CGFloat = 0
let width = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading))
ctx.textPosition = CGPoint(x: (CGFloat(size) - width) / 2, y: (CGFloat(size) - (ascent + descent)) / 2)
CTLineDraw(line, ctx)

guard let image = ctx.makeImage() else { fatalError("makeImage") }
guard let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: outPath) as CFURL, "public.png" as CFString, 1, nil) else {
    fatalError("dest")
}
CGImageDestinationAddImage(dest, image, nil)
guard CGImageDestinationFinalize(dest) else { fatalError("finalize") }
print("wrote \(outPath) \(size)x\(size)")
