// Render assets/img/og.png (1200x630) — dark bg, amber glow, dot grid, site title.
import Foundation
import CoreGraphics
import CoreText
import ImageIO

let W = 1200, H = 630
let amber = CGColor(red: 0.961, green: 0.702, blue: 0.004, alpha: 1)
let amberBright = CGColor(red: 1.0, green: 0.773, blue: 0.239, alpha: 1)
let white = CGColor(red: 0.94, green: 0.94, blue: 0.95, alpha: 1)
let dim = CGColor(red: 0.55, green: 0.55, blue: 0.58, alpha: 1)

guard let ctx = CGContext(
    data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else { fatalError("context") }

// Background #0c0c0e
ctx.setFillColor(CGColor(red: 0.047, green: 0.047, blue: 0.055, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))

// Radial amber glows
let glowColors = [CGColor(red: 0.961, green: 0.702, blue: 0.004, alpha: 0.30),
                  CGColor(red: 0.961, green: 0.702, blue: 0.004, alpha: 0)] as CFArray
if let g = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
                      colors: glowColors, locations: [0, 1]) {
    ctx.drawRadialGradient(g, startCenter: CGPoint(x: 260, y: 540), startRadius: 0,
                           endCenter: CGPoint(x: 260, y: 540), endRadius: 560, options: [])
    ctx.drawRadialGradient(g, startCenter: CGPoint(x: 1020, y: 90), startRadius: 0,
                           endCenter: CGPoint(x: 1020, y: 90), endRadius: 460, options: [])
}

// Subtle dot grid
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.06))
for x in stride(from: 24, to: W, by: 40) {
    for y in stride(from: 24, to: H, by: 40) {
        ctx.fill(CGRect(x: x, y: y, width: 2, height: 2))
    }
}

func drawText(_ s: String, size: CGFloat, x: Int, y: Int, font: String, color: CGColor) {
    guard let f = CTFontCreateWithName(font as CFString, size, nil) as CTFont? else { return }
    let attrs: [String: Any] = [kCTFontAttributeName as String: f,
                                kCTForegroundColorAttributeName as String: color]
    guard let attr = CFAttributedStringCreate(nil, s as CFString, attrs as CFDictionary) else { return }
    let line = CTLineCreateWithAttributedString(attr)
    ctx.textPosition = CGPoint(x: CGFloat(x), y: CGFloat(y))
    CTLineDraw(line, ctx)
}

// Brand tag
drawText("<zeinzulaziz/>", size: 30, x: 80, y: H - 90, font: "Menlo-Bold", color: amberBright)
// Accent bar
ctx.setFillColor(amber)
ctx.fill(CGRect(x: 80, y: H - 210, width: 76, height: 6))
// Title + subtitle
drawText("Moh Zein Zulfanul Aziz", size: 66, x: 80, y: H - 300, font: "HelveticaNeue-Bold", color: white)
drawText("WordPress Developer & AI Product Builder", size: 32, x: 80, y: H - 355,
         font: "HelveticaNeue-Medium", color: amberBright)
drawText("Ships fast with AI — Harga Pangan, Convert Gold, and more.", size: 26,
         x: 80, y: H - 410, font: "HelveticaNeue-Regular", color: dim)
// URL footer
drawText("zeinzulaziz.github.io", size: 24, x: 80, y: 70, font: "Menlo-Regular", color: dim)

guard let image = ctx.makeImage() else { fatalError("makeImage") }
let outURL = URL(fileURLWithPath: "assets/img/og.jpg") as CFURL
guard let dest = CGImageDestinationCreateWithURL(outURL, "public.jpeg" as CFString, 1, nil) else {
    fatalError("dest")
}
let opts: [String: Any] = [kCGImageDestinationLossyCompressionQuality as String: 0.85]
CGImageDestinationAddImage(dest, image, opts as CFDictionary)
guard CGImageDestinationFinalize(dest) else { fatalError("finalize") }
print("wrote assets/img/og.jpg \(W)x\(H)")
