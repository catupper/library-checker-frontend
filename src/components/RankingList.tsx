import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";
import { useRanking } from "../api/library_checker_client";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const RankingList: React.FC = () => {
  const rankingQuery = useRanking();

  if (rankingQuery.isLoading || rankingQuery.isIdle) {
    return (
      <Box>
        <Typography>Loading...</Typography>
      </Box>
    );
  }
  if (rankingQuery.isError) {
    return (
      <Box>
        <Typography>Error: {rankingQuery.error}</Typography>
      </Box>
    );
  }

  const rows = rankingQuery.data.getStatisticsList().map((e, index) => {
    return {
      id: index,
      name: e.getName(),
      count: e.getCount(),
    };
  });
  return (
    <Box style={{ height: 2000 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ranking</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>AC Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id + 1}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RankingList;
