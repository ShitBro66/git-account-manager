<template>
  <div class="container">
    <el-container style="height: 100vh;">
      <el-header class="header">
        <h2>Git 账户管理器</h2>
        <div class="current-info" v-if="currentGlobal">
          <el-tag type="success">当前全局: {{ currentGlobal.name }} &lt;{{ currentGlobal.email }}&gt;</el-tag>
        </div>
      </el-header>

      <el-main>
        <el-row :gutter="20">
          <el-col :span="14">
            <el-card class="box-card">
              <template #header>
                <div class="card-header">
                  <span>已保存账户</span>
                </div>
              </template>
              <el-table :data="accounts" style="width: 100%" stripe>
                <el-table-column prop="name" label="用户名" width="120" />
                <el-table-column prop="email" label="邮箱" />
                <el-table-column label="SSH 密钥" show-overflow-tooltip>
                  <template #default="scope">
                    {{ scope.row.sshKeyPath || '无' }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="250">
                  <template #default="scope">
                    <el-button 
                      size="small" 
                      type="primary" 
                      @click="handleSwitch(scope.row.id)"
                      :loading="switching === scope.row.id"
                      :disabled="activeId === scope.row.id"
                    >
                      {{ activeId === scope.row.id ? '当前生效' : '切换' }}
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="handleEdit(scope.row)"
                    >编辑</el-button>
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="handleRemove(scope.row.id)"
                    >删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          
          <el-col :span="10">
            <el-card class="box-card">
              <template #header>
                <div class="card-header">
                  <span>{{ isEditing ? '编辑账户' : '添加新账户' }}</span>
                  <el-button v-if="isEditing" size="small" @click="cancelEdit">取消</el-button>
                </div>
              </template>
              <el-form :model="form" label-width="80px">
                <el-form-item label="用户名">
                  <el-input v-model="form.name" placeholder="Git 用户名" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="form.email" placeholder="Git 邮箱" />
                </el-form-item>
                <el-form-item label="SSH 密钥">
                  <el-input v-model="form.sshKeyPath" placeholder="私钥路径">
                    <template #append>
                      <el-button @click="selectKeyFile">浏览</el-button>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSave">{{ isEditing ? '更新账户' : '添加账户' }}</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const accounts = ref([])
const activeId = ref(null)
const switching = ref(null)
const currentGlobal = ref(null)
const isEditing = ref(false)

const form = ref({
  id: null,
  name: '',
  email: '',
  sshKeyPath: ''
})

const refreshData = async () => {
  const config = await window.electronAPI.getAccounts()
  accounts.value = config.accounts
  activeId.value = config.activeId
  
  const globalConfig = await window.electronAPI.getGlobalConfig()
  currentGlobal.value = globalConfig
}

onMounted(() => {
  refreshData()
})

const selectKeyFile = async () => {
  const path = await window.electronAPI.selectFile()
  if (path) {
    form.value.sshKeyPath = path
  }
}

const handleEdit = (account) => {
  isEditing.value = true
  form.value = { ...account }
}

const cancelEdit = () => {
  isEditing.value = false
  form.value = { id: null, name: '', email: '', sshKeyPath: '' }
}

const handleSave = async () => {
  if (!form.value.name || !form.value.email) {
    ElMessage.error('用户名和邮箱是必填项')
    return
  }
  
  try {
    if (isEditing.value) {
      await window.electronAPI.updateAccount({ ...form.value })
      ElMessage.success('账户已更新')
    } else {
      await window.electronAPI.addAccount({ ...form.value })
      ElMessage.success('账户已添加')
    }
    cancelEdit()
    await refreshData()
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

const handleRemove = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个账户吗?', '警告', {
      type: 'warning'
    })
    await window.electronAPI.removeAccount(id)
    ElMessage.success('账户已删除')
    await refreshData()
  } catch (e) {
    // cancelled or error
  }
}

const handleSwitch = async (id) => {
  switching.value = id
  try {
    const result = await window.electronAPI.switchAccount(id)
    if (result.success) {
      ElMessage.success(`已切换到 ${result.gitConfig.name}`)
      await refreshData()
    }
  } catch (error) {
    ElMessage.error('切换失败: ' + error.message)
  } finally {
    switching.value = null
  }
}
</script>

<style scoped>
.container {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
.header {
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}
.current-info {
  font-size: 14px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
