import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  People as PeopleIcon,
  Devices as DevicesIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { merchantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MerchantDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // 用户和终端列表状态
  const [users, setUsers] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(5);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [terminalPage, setTerminalPage] = useState(0);
  const [terminalPageSize, setTerminalPageSize] = useState(5);
  const [terminalTotalCount, setTerminalTotalCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTerminals, setLoadingTerminals] = useState(false);

  // 判断当前用户是否是系统管理员
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');

  // 加载商户数据
  useEffect(() => {
    const loadMerchant = async () => {
      try {
        setLoading(true);
        const merchantData = await merchantAPI.getMerchant(id);
        setMerchant(merchantData);

        // 设置表单初始值
        formik.setValues({
          merchantID: merchantData.merchantID || '',
          name: merchantData.name || '',
          contactName: merchantData.contactName || '',
          contactPhone: merchantData.contactPhone || '',
          contactEmail: merchantData.contactEmail || '',
          address: merchantData.address || '',
          isActive: merchantData.isActive || false
        });
      } catch (error) {
        enqueueSnackbar('加载商户数据失败', { variant: 'error' });
        console.error('加载商户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMerchant();
  }, [id, enqueueSnackbar]);

  // 加载商户用户
  const loadMerchantUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await merchantAPI.getMerchantUsers(id, {
        page: userPage + 1, // API使用1-based索引
        pageSize: userPageSize
      });
      setUsers(response.items);
      setUserTotalCount(response.totalCount);
    } catch (error) {
      enqueueSnackbar('加载商户用户失败', { variant: 'error' });
      console.error('加载商户用户失败:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 加载商户终端
  const loadMerchantTerminals = async () => {
    try {
      setLoadingTerminals(true);
      const response = await merchantAPI.getMerchantTerminals(id, {
        page: terminalPage + 1, // API使用1-based索引
        pageSize: terminalPageSize
      });
      setTerminals(response.items);
      setTerminalTotalCount(response.totalCount);
    } catch (error) {
      enqueueSnackbar('加载商户终端失败', { variant: 'error' });
      console.error('加载商户终端失败:', error);
    } finally {
      setLoadingTerminals(false);
    }
  };

  // 加载商户用户和终端
  useEffect(() => {
    if (id && tabValue === 1) {
      loadMerchantUsers();
    }
  }, [id, userPage, userPageSize, tabValue]);

  useEffect(() => {
    if (id && tabValue === 2) {
      loadMerchantTerminals();
    }
  }, [id, terminalPage, terminalPageSize, tabValue]);

  // 表单验证和提交
  const formik = useFormik({
    initialValues: {
      merchantID: '',
      name: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      isActive: false
    },
    validationSchema: Yup.object({
      name: Yup.string().required('商户名称是必填项'),
      contactName: Yup.string().required('联系人是必填项'),
      contactPhone: Yup.string().required('联系电话是必填项'),
      contactEmail: Yup.string().email('无效的邮箱格式').required('联系邮箱是必填项'),
      address: Yup.string()
    }),
    onSubmit: async (values) => {
      try {
        setSaving(true);
        await merchantAPI.updateMerchant(id, values);
        enqueueSnackbar('商户信息更新成功', { variant: 'success' });
        // 重新加载商户数据
        const updatedMerchant = await merchantAPI.getMerchant(id);
        setMerchant(updatedMerchant);
      } catch (error) {
        enqueueSnackbar(`更新商户失败: ${error.message}`, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  });

  // 处理删除商户
  const handleDeleteMerchant = async () => {
    try {
      setLoading(true);
      await merchantAPI.deleteMerchant(id);
      enqueueSnackbar('商户删除成功', { variant: 'success' });
      navigate('/app/merchants');
    } catch (error) {
      enqueueSnackbar(`删除商户失败: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // 处理激活/停用商户
  const handleToggleActive = async () => {
    try {
      setLoading(true);
      if (merchant.isActive) {
        await merchantAPI.deactivateMerchant(id);
        enqueueSnackbar('商户已停用', { variant: 'success' });
      } else {
        await merchantAPI.activateMerchant(id);
        enqueueSnackbar('商户已激活', { variant: 'success' });
      }
      // 重新加载商户数据
      const updatedMerchant = await merchantAPI.getMerchant(id);
      setMerchant(updatedMerchant);
      formik.setFieldValue('isActive', updatedMerchant.isActive);
    } catch (error) {
      enqueueSnackbar(`操作失败: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理用户分页
  const handleChangeUserPage = (event, newPage) => {
    setUserPage(newPage);
  };

  const handleChangeUserPageSize = (event) => {
    setUserPageSize(parseInt(event.target.value, 10));
    setUserPage(0);
  };

  // 处理终端分页
  const handleChangeTerminalPage = (event, newPage) => {
    setTerminalPage(newPage);
  };

  const handleChangeTerminalPageSize = (event) => {
    setTerminalPageSize(parseInt(event.target.value, 10));
    setTerminalPage(0);
  };

  if (loading && !merchant) {
    return (
      <Container maxWidth={false}>
        <Box sx={{ pt: 3, pb: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/app/merchants')}
          >
            返回商户列表
          </Button>
          {isSystemAdmin && (
            <Box>
              <Button
                variant="outlined"
                color={merchant?.isActive ? "default" : "primary"}
                startIcon={merchant?.isActive ? <InactiveIcon /> : <ActiveIcon />}
                onClick={handleToggleActive}
                sx={{ mr: 1 }}
                disabled={loading || saving}
              >
                {merchant?.isActive ? '停用商户' : '激活商户'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading || saving}
              >
                删除商户
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="h4" sx={{ mb: 3 }}>
          商户详情
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="基本信息" />
            <Tab label="用户管理" />
            <Tab label="终端管理" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <form onSubmit={formik.handleSubmit}>
            <Card>
              <CardHeader title="商户信息" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="商户ID"
                      name="merchantID"
                      value={formik.values.merchantID}
                      disabled={true} // 商户ID不可修改
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="商户名称"
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                      disabled={loading || !isSystemAdmin}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="联系人"
                      name="contactName"
                      value={formik.values.contactName}
                      onChange={formik.handleChange}
                      error={formik.touched.contactName && Boolean(formik.errors.contactName)}
                      helperText={formik.touched.contactName && formik.errors.contactName}
                      disabled={loading || !isSystemAdmin}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="联系电话"
                      name="contactPhone"
                      value={formik.values.contactPhone}
                      onChange={formik.handleChange}
                      error={formik.touched.contactPhone && Boolean(formik.errors.contactPhone)}
                      helperText={formik.touched.contactPhone && formik.errors.contactPhone}
                      disabled={loading || !isSystemAdmin}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="联系邮箱"
                      name="contactEmail"
                      type="email"
                      value={formik.values.contactEmail}
                      onChange={formik.handleChange}
                      error={formik.touched.contactEmail && Boolean(formik.errors.contactEmail)}
                      helperText={formik.touched.contactEmail && formik.errors.contactEmail}
                      disabled={loading || !isSystemAdmin}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="地址"
                      name="address"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      error={formik.touched.address && Boolean(formik.errors.address)}
                      helperText={formik.touched.address && formik.errors.address}
                      disabled={loading || !isSystemAdmin}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isActive"
                          checked={formik.values.isActive}
                          onChange={formik.handleChange}
                          disabled={loading || !isSystemAdmin}
                        />
                      }
                      label="商户已激活"
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              {isSystemAdmin && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    color="primary"
                    variant="contained"
                    type="submit"
                    disabled={loading || saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </Box>
              )}
            </Card>
          </form>
        )}

        {tabValue === 1 && (
          <Card>
            <CardHeader
              title="商户用户"
              avatar={<PeopleIcon />}
              subheader={`共 ${userTotalCount} 个用户`}
              action={
                (isSystemAdmin || user?.roles?.includes('MerchantAdmin')) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/app/merchants/${id}/users`)}
                    sx={{ mr: 2 }}
                  >
                    管理用户
                  </Button>
                )
              }
            />
            <Divider />
            <CardContent>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>用户名</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>邮箱</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>真实姓名</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>角色</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell align="right" sx={{ minWidth: 80 }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingUsers && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress size={24} sx={{ my: 2 }} />
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingUsers && users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          没有找到用户
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingUsers &&
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.userName}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{user.email}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{user.realName}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            {user.roles.map((role) => {
                              let color = 'default';
                              if (role === 'SystemAdmin') color = 'error';
                              else if (role === 'MerchantAdmin') color = 'primary';
                              else if (role === 'User') color = 'success';

                              return (
                                <Chip
                                  key={role}
                                  label={role}
                                  color={color}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              );
                            })}
                          </TableCell>
                          <TableCell>
                            {user.lockoutEnd && new Date(user.lockoutEnd) > new Date() ? (
                              <Chip label="已锁定" color="error" size="small" />
                            ) : (
                              <Chip label="正常" color="success" size="small" />
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title="查看详情">
                              <IconButton
                                onClick={() => navigate(`/app/users/${user.id}`)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={userTotalCount}
                page={userPage}
                onPageChange={handleChangeUserPage}
                rowsPerPage={userPageSize}
                onRowsPerPageChange={handleChangeUserPageSize}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} / ${count !== -1 ? count : `超过 ${to}`}`
                }
              />
            </CardContent>
          </Card>
        )}

        {tabValue === 2 && (
          <Card>
            <CardHeader
              title="商户终端"
              avatar={<DevicesIcon />}
              subheader={`共 ${terminalTotalCount} 个终端`}
              action={
                (isSystemAdmin || user?.roles?.includes('MerchantAdmin')) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/app/merchants/${id}/terminals`)}
                    sx={{ mr: 2 }}
                  >
                    管理终端
                  </Button>
                )
              }
            />
            <Divider />
            <CardContent>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>终端ID</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>设备编号</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>线路编号</TableCell>
                      <TableCell>终端类型</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>创建时间</TableCell>
                      <TableCell align="right" sx={{ minWidth: 80 }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingTerminals && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress size={24} sx={{ my: 2 }} />
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingTerminals && terminals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          没有找到终端
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingTerminals &&
                      terminals.map((terminal) => (
                        <TableRow key={terminal.id}>
                          <TableCell>{terminal.id}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{terminal.deviceNO}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{terminal.lineNO}</TableCell>
                          <TableCell>{terminal.terminalType}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{new Date(terminal.createTime).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title="查看详情">
                              <IconButton
                                onClick={() => navigate(`/app/terminals/${terminal.id}`)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={terminalTotalCount}
                page={terminalPage}
                onPageChange={handleChangeTerminalPage}
                rowsPerPage={terminalPageSize}
                onRowsPerPageChange={handleChangeTerminalPageSize}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} / ${count !== -1 ? count : `超过 ${to}`}`
                }
              />
            </CardContent>
          </Card>
        )}
      </Box>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除商户 "{merchant?.name}" ({merchant?.merchantID}) 吗？此操作不可撤销。
            删除商户前，请确保该商户下没有用户和终端。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleDeleteMerchant} color="error" disabled={loading} autoFocus>
            {loading ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MerchantDetailView;
