import { useState, type MouseEvent } from "react";
import {
  Box,
  ButtonBase,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import DocumentIcon from "@diligentcorp/atlas-react-bundle/icons/Document";
import type { Block, Source, Span } from "./scenarios.js";

// ─── Citation chip + passage preview ─────────────────────────────────────────

function CitationChip({ source }: { source: Source }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);

  return (
    <>
      <Tooltip title={`${source.doc}, page ${source.page}`} placement="top" arrow>
        <ButtonBase
          onClick={open}
          aria-label={`Source ${source.n}: ${source.doc}, page ${source.page}. Show passage.`}
          sx={({ tokens }) => ({
            minWidth: "20px",
            height: "18px",
            px: tokens.semantic.spacing.desktop.padding["1"].value,
            mx: tokens.semantic.spacing.desktop.gap["0_25"].value,
            borderRadius: tokens.semantic.radius.sm.value,
            backgroundColor: tokens.semantic.color.selection.primary.default.value,
            color: tokens.semantic.color.selection.primary.onSelected.value,
            fontFamily: tokens.semantic.font.label.xs.fontFamily.value,
            fontSize: tokens.semantic.font.label.xs.fontSize.value,
            fontWeight: tokens.semantic.fontWeight.emphasis.value,
            lineHeight: "18px",
            verticalAlign: "text-bottom",
            "&:hover": { backgroundColor: tokens.semantic.color.selection.primary.hover.value },
            "&:focus-visible": { outline: `2px solid ${tokens.semantic.color.ui.focusRing.value}` },
          })}
        >
          {source.n}
        </ButtonBase>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { maxWidth: 360 } } }}
      >
        <Stack
          sx={({ tokens }) => ({
            p: tokens.semantic.spacing.desktop.padding["2_5"].value,
            gap: tokens.semantic.spacing.desktop.gap["1"].value,
          })}
        >
          <Stack direction="row" sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["1"].value, alignItems: "center" })}>
            <DocumentIcon size="md" aria-hidden />
            <Stack>
              <Typography variant="labelSm">{source.doc}</Typography>
              <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
                {source.book} · page {source.page}
              </Typography>
            </Stack>
          </Stack>
          <Box
            component="blockquote"
            sx={({ tokens }) => ({
              m: 0,
              p: tokens.semantic.spacing.desktop.padding["2"].value,
              borderRadius: tokens.semantic.radius.md.value,
              backgroundColor: tokens.semantic.color.accent.yellow.background.value,
              borderLeft: `3px solid ${tokens.semantic.color.status.warning.default.value}`,
            })}
          >
            <Typography variant="textSm">“{source.excerpt}”</Typography>
          </Box>
          <Typography variant="textSm" sx={({ tokens }) => ({ color: tokens.semantic.color.type.muted.value })}>
            In the product, this opens the document at the highlighted passage.
          </Typography>
        </Stack>
      </Popover>
    </>
  );
}

// ─── Spans and blocks ────────────────────────────────────────────────────────

function Spans({ spans, sources }: { spans: Span[]; sources: Source[] }) {
  return (
    <>
      {spans.map((s, i) => {
        if (typeof s === "string") return <span key={i}>{s}</span>;
        if ("b" in s)
          return (
            <Box component="strong" key={i} sx={({ tokens }) => ({ fontWeight: tokens.semantic.fontWeight.emphasis.value })}>
              {s.b}
            </Box>
          );
        const src = sources.find((x) => x.n === s.cite);
        return src ? <CitationChip key={i} source={src} /> : null;
      })}
    </>
  );
}

export default function RichAnswer({ blocks, sources }: { blocks: Block[]; sources: Source[] }) {
  return (
    <Stack sx={({ tokens }) => ({ gap: tokens.semantic.spacing.desktop.gap["2"].value })}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <Typography key={i} variant="textMd" component="p">
                <Spans spans={b.spans} sources={sources} />
              </Typography>
            );
          case "h":
            return (
              <Typography key={i} variant="labelLg" component="h3" sx={{ m: 0 }}>
                {b.text}
              </Typography>
            );
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Box
                key={i}
                component={Tag}
                sx={({ tokens }) => ({
                  m: 0,
                  pl: tokens.semantic.spacing.desktop.padding["3"].value,
                  display: "flex",
                  flexDirection: "column",
                  gap: tokens.semantic.spacing.desktop.gap["1"].value,
                })}
              >
                {b.items.map((item, j) => (
                  <Typography key={j} component="li" variant="textMd">
                    <Spans spans={item} sources={sources} />
                  </Typography>
                ))}
              </Box>
            );
          }
          case "table":
            return (
              <TableContainer
                key={i}
                sx={({ tokens }) => ({
                  border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
                  borderRadius: tokens.semantic.radius.md.value,
                })}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {b.columns.map((c) => (
                        <TableCell key={c}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {b.rows.map((row, r) => (
                      <TableRow key={r}>
                        {row.map((cell, c) => (
                          <TableCell key={c}>
                            <Typography variant="textSm" component="span">
                              <Spans spans={cell} sources={sources} />
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
        }
      })}
    </Stack>
  );
}
