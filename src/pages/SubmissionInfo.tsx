import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Autorenew, ExpandMore } from "@mui/icons-material";
import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import {
  RejudgeRequest,
  SubmissionInfoRequest,
} from "../api/library_checker_pb";
import SubmissionTable from "../components/SubmissionTable";
import SourceEditor from "../components/SourceEditor";
import { AuthContext } from "../contexts/AuthContext";
import library_checker_client, {
  authMetadata,
  useUserInfo,
} from "../api/library_checker_client";
import { useQuery } from "react-query";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import { LibraryBooks } from "@mui/icons-material";
import { Divider } from "@mui/material";

const LibraryButton: React.FC<{ name: string }> = (props) => {
  const userInfoQuery = useUserInfo(props.name, {});

  if (userInfoQuery.isLoading || userInfoQuery.isIdle) {
    return (
      <Box>
        <CircularProgress />
      </Box>
    );
  }
  if (userInfoQuery.isError) {
    return <Box>Failed to load user</Box>;
  }

  const userInfo = userInfoQuery.data;
  const user = userInfo.getUser();

  if (!user) {
    return <Box>Failed to load user</Box>;
  }

  const libraryURL = user.getLibraryUrl();

  if (!libraryURL) {
    return <Box></Box>;
  }
  return (
    <Button variant="outlined" startIcon={<LibraryBooks />}>
      <Link href={libraryURL}> {libraryURL}</Link>
    </Button>
  );
};

const Overview: React.FC<{ submissionId: number }> = (props) => {
  const { submissionId } = props;
  const auth = useContext(AuthContext);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const submissionInfoQuery = useQuery(
    ["submissionInfo", submissionId],
    () =>
      library_checker_client.submissionInfo(
        new SubmissionInfoRequest().setId(submissionId),
        (auth ? authMetadata(auth.state) : null) ?? null
      ),
    {
      refetchInterval: autoRefresh ? 1000 : false,
      onSuccess: () => {
        const status = submissionInfoQuery.data?.getOverview()?.getStatus();
        if (
          status &&
          new Set(["AC", "WA", "RE", "TLE", "PE", "Fail", "CE", "IE"]).has(
            status
          )
        ) {
          setAutoRefresh(false);
        }
      },
    }
  );

  if (submissionInfoQuery.isLoading || submissionInfoQuery.isIdle) {
    return (
      <Box>
        <CircularProgress />
      </Box>
    );
  }
  if (submissionInfoQuery.isError) {
    return <Box>Loading error</Box>;
  }
  const info = submissionInfoQuery.data;
  const overview = info.getOverview();

  if (!overview) {
    return <Box>Loading error</Box>;
  }

  const handleRejudge = (e: React.FormEvent) => {
    e.preventDefault();
    library_checker_client
      .rejudge(
        new RejudgeRequest().setId(submissionId),
        (auth ? authMetadata(auth.state) : null) ?? null
      )
      .then(() => {
        console.log("Rejudge requested");
      });
    setAutoRefresh(true);
  };

  return (
    <Box>
      <SubmissionTable overviews={[overview]} />
      <Box
        sx={{
          marginTop: 1,
        }}
      >
        <LibraryButton name={overview.getUserName()} />
        {info.getCanRejudge() && (
          <Button
            variant="outlined"
            startIcon={<Autorenew />}
            onClick={handleRejudge}
          >
            Rejudge
          </Button>
        )}
      </Box>
    </Box>
  );
};

const CaseResults: React.FC<{ submissionId: number }> = (props) => {
  const { submissionId } = props;
  const auth = useContext(AuthContext);

  const submissionInfoQuery = useQuery(["submissionInfo", submissionId], () =>
    library_checker_client.submissionInfo(
      new SubmissionInfoRequest().setId(submissionId),
      (auth ? authMetadata(auth.state) : null) ?? null
    )
  );

  if (submissionInfoQuery.isLoading || submissionInfoQuery.isIdle) {
    return (
      <Box>
        <CircularProgress />
      </Box>
    );
  }
  if (submissionInfoQuery.isError) {
    return <Box>Loading error</Box>;
  }
  const info = submissionInfoQuery.data;
  const overview = info.getOverview();

  if (!overview) {
    return <Box>Loading error</Box>;
  }

  return (
    <Box>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Case Results</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Memory</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {info.getCaseResultsList().map((row) => (
                  <TableRow key={row.getCase()}>
                    <TableCell>{row.getCase()}</TableCell>
                    <TableCell>{row.getStatus()}</TableCell>
                    <TableCell>{Math.round(row.getTime() * 1000)} ms</TableCell>
                    <TableCell>
                      {row.getMemory() === -1
                        ? -1
                        : (row.getMemory() / 1024 / 1024).toFixed(2)}{" "}
                      Mib
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const SubmissionInfo: React.FC = () => {
  const auth = useContext(AuthContext);

  const { submissionId } = useParams<"submissionId">();
  if (!submissionId) {
    throw new Error(`submissionId is not defined`);
  }
  const submissionIdInt = parseInt(submissionId);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const submissionInfoQuery = useQuery(
    ["submissionInfo", submissionId],
    () =>
      library_checker_client.submissionInfo(
        new SubmissionInfoRequest().setId(submissionIdInt),
        (auth ? authMetadata(auth.state) : null) ?? null
      ),
    {
      refetchInterval: autoRefresh ? 1000 : false,
      onSuccess: () => {
        const status = submissionInfoQuery.data?.getOverview()?.getStatus();
        if (
          status &&
          new Set(["AC", "WA", "RE", "TLE", "PE", "Fail", "CE", "IE"]).has(
            status
          )
        ) {
          setAutoRefresh(false);
        }
      },
    }
  );

  if (submissionInfoQuery.isLoading || submissionInfoQuery.isIdle) {
    return <h1>Loading</h1>;
  }
  if (submissionInfoQuery.isError) {
    return <h1>Error</h1>;
  }

  const info = submissionInfoQuery.data;
  const compileError = new TextDecoder().decode(info.getCompileError_asU8());
  const overview = info.getOverview();
  const lang = overview ? overview.getLang() : undefined;

  return (
    <Box>
      <Typography variant="h2" paragraph={true}>
        Submission Info #{submissionId}
      </Typography>
      <Overview submissionId={submissionIdInt} />
      <Divider
        sx={{
          marginTop: 3,
          marginBottom: 3,
        }}
      />
      {compileError && (
        <Paper>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Compile Error</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre>{compileError}</pre>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
      <CaseResults submissionId={submissionIdInt} />
      <Divider
        sx={{
          marginTop: 3,
          marginBottom: 3,
        }}
      />
      <Paper>
        <SourceEditor
          value={info.getSource()}
          language={lang}
          readOnly={true}
          autoHeight={true}
        />
      </Paper>
    </Box>
  );
};

export default SubmissionInfo;
