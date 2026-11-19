import { Card, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

// Atlas AI Callout (AI content area). A message the user needs to notice and
// respond to: optional title, supporting text, then the actions stacked below
// (vertical alignment). Atlas has no code component for it yet, so this follows
// the Figma spec with Atlas Card, Typography and Button plus design tokens:
// Components – Atlas Lens/Light/Dark, node 89082:12848.
//   Border: outline static · radius lg-16 · padding 2 · content gap 12
//   Title: H4 Md emphasis · text: Body · title/text gap 0.5
//   Actions: extra-small buttons, tertiary then primary, gap 8
export default function AICallout({
  title,
  children,
  actions,
  ...rest
}: {
  title?: ReactNode;
  children: ReactNode;
  /** Extra-small Buttons: tertiary (text) first, primary (contained) last. */
  actions?: ReactNode;
  "aria-label"?: string;
  "aria-live"?: "polite" | "off";
}) {
  const { tokens } = useTheme();
  const { color, font, fontWeight, spacing } = tokens.semantic;
  const core = tokens.core.spacing;
  const h4 = font.title.h4Md;
  const body = font.text.body;

  return (
    <Card
      variant="outlined"
      role="group"
      {...rest}
      sx={{
        width: "100%",
        mt: core["1_5"].value,
        p: spacing.desktop.padding["2"].value,
        borderColor: color.outline.fixed.value,
        borderRadius: core["2"].value,
        boxShadow: "none",
      }}
    >
      <Stack sx={{ gap: core["1_5"].value }}>
        <Stack sx={{ gap: spacing.desktop.gap["0_5"].value, color: color.type.default.value }}>
          {title && (
            <Typography
              component="h3"
              sx={{
                m: 0,
                fontFamily: h4.fontFamily.value,
                fontSize: h4.fontSize.value,
                lineHeight: h4.lineHeight.value,
                letterSpacing: h4.letterSpacing.value,
                fontWeight: fontWeight.emphasis.value,
              }}
            >
              {title}
            </Typography>
          )}
          <Typography
            component="div"
            sx={{
              fontFamily: body.fontFamily.value,
              fontSize: body.fontSize.value,
              lineHeight: body.lineHeight.value,
              letterSpacing: body.letterSpacing.value,
            }}
          >
            {children}
          </Typography>
        </Stack>
        {actions && (
          <Stack direction="row" sx={{ gap: core["1"].value }}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
