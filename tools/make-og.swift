// Render assets/img/og.jpg (1200x630) in the night observatory direction:
// deep ink ground (#080d16), chalk ink (#ede6d9), one copper light source
// (#d8a579) drawn as an eclipse. See DESIGN.md.
import Foundation
import CoreGraphics
import CoreText
import ImageIO

let W = 1200, H = 630
let paper = CGColor(red: 0.031, green: 0.051, blue: 0.086, alpha: 1)      // #080d16
let ink = CGColor(red: 0.929, green: 0.902, blue: 0.851, alpha: 1)        // #ede6d9
let inkSoft = CGColor(red: 0.725, green: 0.725, blue: 0.686, alpha: 1)    // #b9b9af
let inkFaint = CGColor(red: 0.561, green: 0.592, blue: 0.561, alpha: 1)   // #8f978f
let copper = CGColor(red: 0.847, green: 0.647, blue: 0.475, alpha: 1)     // #d8a579

guard let ctx = CGContext(
    data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else { fatalError("context") }

ctx.setFillColor(paper)
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))

// Film grain: the same 1px dot rhythm the page uses, tone on tone.
ctx.setFillColor(CGColor(red: 0.078, green: 0.098, blue: 0.133, alpha: 1))
for x in stride(from: 24, to: W, by: 12) {
    for y in stride(from: 24, to: H, by: 12) {
        ctx.fill(CGRect(x: x, y: y, width: 1, height: 1))
    }
}

// --- the eclipse: one copper light source, occluded -------------------------
let cx = 930.0, cy = 330.0, r = 108.0

// soft corona
if let space = CGColorSpace(name: CGColorSpace.sRGB),
   let grad = CGGradient(colorsSpace: space,
                         colors: [CGColor(red: 0.847, green: 0.647, blue: 0.475, alpha: 0.30),
                                  CGColor(red: 0.847, green: 0.647, blue: 0.475, alpha: 0.0)] as CFArray,
                         locations: [0.0, 1.0]) {
    ctx.drawRadialGradient(grad,
                           startCenter: CGPoint(x: cx, y: cy), startRadius: r * 0.5,
                           endCenter: CGPoint(x: cx, y: cy), endRadius: r * 3.4,
                           options: [])
}

// the light body
ctx.setFillColor(copper)
ctx.fillEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))

// the occluder, offset so a crescent of light survives
let ox = cx + 40.0, oy = cy - 26.0
ctx.setFillColor(paper)
ctx.fillEllipse(in: CGRect(x: ox - r, y: oy - r, width: r * 2, height: r * 2))

// the limb of the occluder catching the light
ctx.setStrokeColor(CGColor(red: 0.847, green: 0.647, blue: 0.475, alpha: 0.85))
ctx.setLineWidth(1.5)
ctx.strokeEllipse(in: CGRect(x: ox - r, y: oy - r, width: r * 2, height: r * 2))

func drawText(_ s: String, size: CGFloat, x: Int, y: Int, font: String, color: CGColor) {
    guard let f = CTFontCreateWithName(font as CFString, size, nil) as CTFont? else { return }
    let attrs: [String: Any] = [kCTFontAttributeName as String: f,
                                kCTForegroundColorAttributeName as String: color]
    guard let attr = CFAttributedStringCreate(nil, s as CFString, attrs as CFDictionary) else { return }
    let line = CTLineCreateWithAttributedString(attr)
    ctx.textPosition = CGPoint(x: CGFloat(x), y: CGFloat(y))
    CTLineDraw(line, ctx)
}

// Brand tag (mono, metadata voice)
drawText("OBSERVATORY / 001", size: 22, x: 80, y: H - 84, font: "Menlo-Regular", color: copper)
// Name in display weight, role and lede below in quieter tones.
drawText("Moh Zein Zulfanul Aziz", size: 64, x: 80, y: H - 200, font: "HelveticaNeue-Bold", color: ink)
drawText("WordPress Developer · AI Product Builder", size: 28, x: 80, y: H - 254,
         font: "HelveticaNeue-Medium", color: inkSoft)
drawText("Small products with AI — Harga Pangan, Convert Gold, and more.", size: 24,
         x: 80, y: H - 306, font: "HelveticaNeue-Regular", color: inkFaint)
drawText("zeinzulaziz.github.io", size: 24, x: 80, y: H - 430, font: "Menlo-Regular", color: inkFaint)

guard let image = ctx.makeImage() else { fatalError("makeImage") }
let outURL = URL(fileURLWithPath: "assets/img/og.jpg") as CFURL
guard let dest = CGImageDestinationCreateWithURL(outURL, "public.jpeg" as CFString, 1, nil) else {
    fatalError("dest")
}
let opts: [String: Any] = [kCGImageDestinationLossyCompressionQuality as String: 0.85]
CGImageDestinationAddImage(dest, image, opts as CFDictionary)
guard CGImageDestinationFinalize(dest) else { fatalError("finalize") }
print("wrote assets/img/og.jpg \(W)x\(H)")
