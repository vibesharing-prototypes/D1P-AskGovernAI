import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Container,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { useSmartAssist } from "../context/SmartAssistContext.js";
import { WS_DEMO_START_PATH, WS_DEMO_SUMMARY } from "../data/demo-web-search.js";

// Web-search demo closing screen: what each job needed, and the ask.
export default function DemoWebSearchSummaryPage() {
  const { tokens: { semantic: { color }, core: { spacing } } } = useTheme();
  const navigate = useNavigate();
  const { restartDemo } = useSmartAssist();

  return (
    <Box sx={{ height: "100%", overflowY: "auto", py: spacing["6"].value }}>
      <Container maxWidth="lg">
        <Stack gap={spacing["4"].value}>
          <Typography variant="h1" component="h1">
            Three jobs, three AI roles
          </Typography>

          <TableContainer>
            <Table aria-label="What each step needed">
              <TableHead>
                <TableRow>
                  <TableCell>Step</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Possible today, outside Boards</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {WS_DEMO_SUMMARY.rows.map((r) => (
                  <TableRow key={r.step}>
                    <TableCell>{r.step}</TableCell>
                    <TableCell>{r.question}</TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: r.possibleToday ? color.status.success.text.value : color.status.error.text.value,
                      }}
                    >
                      {r.possibleToday ? "Possible" : "Not possible"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack gap={spacing["1"].value}>
            {WS_DEMO_SUMMARY.lines.map((l) => (
              <Typography key={l} variant="body1" sx={{ color: color.type.default.value }}>
                {l}
              </Typography>
            ))}
          </Stack>

          <Alert severity="info" sx={{ maxWidth: 720 }}>
            {WS_DEMO_SUMMARY.ask}
          </Alert>

          <Box>
            <Link
              component="button"
              type="button"
              underline="always"
              onClick={() => {
                restartDemo();
                navigate(WS_DEMO_START_PATH);
              }}
            >
              Restart demo
            </Link>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
