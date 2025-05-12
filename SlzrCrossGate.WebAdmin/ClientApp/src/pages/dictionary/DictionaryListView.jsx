import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { dictionaryAPI, merchantAPI } from '../../services/api';
import MerchantAutocomplete from '../../components/MerchantAutocomplete';
import DictionaryFormDialog from './DictionaryFormDialog';
import { useAuth } from '../../contexts/AuthContext';

const DictionaryListView = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [dictionaries, setDictionaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dictionaryToDelete, setDictionaryToDelete] = useState(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingDictionary, setEditingDictionary] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [types, setTypes] = useState([]);

  // 加载商户列表
  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const response = await merchantAPI.getMerchants();
        setMerchants(response.items || []);
      } catch (error) {
        console.error('加载商户列表失败', error);
        enqueueSnackbar('加载商户列表失败', { variant: 'error' });
      }
    };

    loadMerchants();
  }, [enqueueSnackbar]);

  useEffect(() => {
    if(selectedMerchant?.merchantID){ 
        loadDictionaryTypes(selectedMerchant?.merchantID);
    }else{
        setTypes([]);
    }
    loadDictionaries();
  }, [page, pageSize, search, selectedMerchant, selectedType]);

  const loadDictionaryTypes = async (merchantId) => {
    try {
      const typesData = await dictionaryAPI.getDictionaryTypes(merchantId);
      setTypes(typesData);
    } catch (error) {
      console.error('加载字典类型失败', error);
      enqueueSnackbar('加载字典类型失败', { variant: 'error' });
    }
  };

  const loadDictionaries = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        pageSize,
        search,
      };

      if (selectedMerchant) {
        params.merchantId = selectedMerchant.merchantID;
      }

      if (selectedType) {
        params.dictionaryType = selectedType;
      }

      const response = await dictionaryAPI.getDictionaries(params);
      
      // 获取响应头中的总数
      const totalCountHeader = response.totalCount || response.length;
      setTotalCount(totalCountHeader || 0);
      
      // 获取数据
      const data = Array.isArray(response) ? response : (response.items || []);
      setDictionaries(data);
    } catch (error) {
      console.error('加载商户字典列表失败', error);
      enqueueSnackbar('加载商户字典列表失败', { variant: 'error' });
      setDictionaries([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      setSearch(searchInput);
      setPage(0);
    }
  };

  const handleSearchClick = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleDeleteClick = (dictionary) => {
    setDictionaryToDelete(dictionary);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dictionaryToDelete) return;

    try {
      await dictionaryAPI.deleteDictionary(dictionaryToDelete.id);
      enqueueSnackbar('字典删除成功', { variant: 'success' });
      loadDictionaries();
    } catch (error) {
      console.error('删除字典失败', error);
      enqueueSnackbar('删除字典失败', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setDictionaryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDictionaryToDelete(null);
  };

  const handleCreateClick = () => {
    setEditingDictionary(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = async (id) => {
    try {
      const dictionary = await dictionaryAPI.getDictionary(id);
      setEditingDictionary(dictionary);
      setFormDialogOpen(true);
    } catch (error) {
      console.error('获取字典详情失败', error);
      enqueueSnackbar('获取字典详情失败', { variant: 'error' });
    }
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditingDictionary(null);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingDictionary) {
        await dictionaryAPI.updateDictionary(editingDictionary.id, data);
        enqueueSnackbar('字典更新成功', { variant: 'success' });
      } else {
        await dictionaryAPI.createDictionary(data);
        enqueueSnackbar('字典创建成功', { variant: 'success' });
      }
      setFormDialogOpen(false);
      setEditingDictionary(null);
      loadDictionaries();
    } catch (error) {
      console.error('保存字典失败', error);
      enqueueSnackbar('保存字典失败: ' + (error.response?.data?.message || '未知错误'), { variant: 'error' });
    }
  };

  const handleMerchantChange = (event, newValue) => {
    setSelectedMerchant(newValue);
    setPage(0);
  };

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setPage(0);
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          商户字典管理
        </Typography>
      </Box>

      <Card sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <MerchantAutocomplete 
              value={selectedMerchant}
              onChange={handleMerchantChange}
              sx={{ minWidth: '250px', width: { xs: '100%', sm: 'auto' } }}
            />
            
            <FormControl sx={{ minWidth: '200px', width: { xs: '100%', sm: 'auto' } }} size="small">
              <InputLabel>字典类型</InputLabel>
              <Select
                value={selectedType}
                onChange={handleTypeChange}
                label="字典类型"
              >
                <MenuItem value="">
                  <em>全部</em>
                </MenuItem>
                {types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              size="small"
              label="搜索"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: { xs: '100%', sm: '200px' } }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={handleSearchClick}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            新建字典
          </Button>
        </Box>
      </Card>

      <Card>
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>商户ID</TableCell>
                <TableCell>商户名称</TableCell>
                <TableCell>字典类型</TableCell>
                <TableCell>字典编码</TableCell>
                <TableCell>字典标签</TableCell>
                <TableCell>字典值</TableCell>
                <TableCell>排序</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : dictionaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                dictionaries.map((dictionary) => (
                  <TableRow key={dictionary.id}>
                    <TableCell>{dictionary.merchantID}</TableCell>
                    <TableCell>{dictionary.merchantName}</TableCell>
                    <TableCell>{dictionary.dictionaryType}</TableCell>
                    <TableCell>{dictionary.dictionaryCode}</TableCell>
                    <TableCell>{dictionary.dictionaryLabel}</TableCell>
                    <TableCell>{dictionary.dictionaryValue}</TableCell>
                    <TableCell>{dictionary.sortOrder}</TableCell>
                    <TableCell>
                      {dictionary.isActive ? (
                        <Chip
                          icon={<CheckCircleIcon fontSize="small" />}
                          label="启用"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon fontSize="small" />}
                          label="禁用"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 120, whiteSpace: 'nowrap' }}>
                      <Tooltip title="编辑">
                        <IconButton size="small" onClick={() => handleEditClick(dictionary.id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton size="small" onClick={() => handleDeleteClick(dictionary)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangePageSize}
          labelRowsPerPage="每页行数:"
        />
      </Card>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除字典 "{dictionaryToDelete?.dictionaryType}-{dictionaryToDelete?.dictionaryCode}" 吗？此操作不可恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建/编辑表单对话框 */}
      <DictionaryFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        dictionary={editingDictionary}
        merchants={merchants}
      />
    </Container>
  );
};

export default DictionaryListView;
