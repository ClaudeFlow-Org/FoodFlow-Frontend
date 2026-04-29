import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  SxProps,
} from '@mui/material';
import { ChangeEvent, useState } from 'react';
import { useI18n } from '@/i18n';

export interface Column<T> {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  width?: number | string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowId: (row: T) => string | number;
  emptyMessage?: string;
  sx?: SxProps;
}

export function DataTable<T>({ columns, rows, rowId, emptyMessage, sx }: DataTableProps<T>) {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <TableContainer component={Paper} sx={sx}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                sx={{ width: column.width, fontWeight: 'bold' }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                {emptyMessage || t('common.noData')}
              </TableCell>
            </TableRow>
          ) : (
            (rowsPerPage > 0
              ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : rows
            ).map((row) => (
              <TableRow key={rowId(row)} hover>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.render(row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={columns.length} />
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, { label: t('common.all'), value: -1 }]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        labelRowsPerPage={t('common.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) =>
          t('common.displayedRows', {
            from,
            to,
            count: count === -1 ? t('common.moreThan', { count: to }) : count,
          })
        }
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
}
