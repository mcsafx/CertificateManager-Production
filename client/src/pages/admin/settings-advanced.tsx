import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RolePermissionsManager } from "@/components/admin/role-permissions-manager";
import { AdvancedFilters } from "@/components/admin/advanced-filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Shield, 
  Database, 
  Mail, 
  Webhook, 
  Key, 
  Monitor,
  Bell,
  Filter,
  Save,
  RotateCcw,
  Download,
  Upload,
  Activity
} from "lucide-react";

export default function AdvancedSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    // General Settings
    systemName: "Certificate Manager",
    systemDescription: "Sistema de gerenciamento de certificados de qualidade",
    maintenanceMode: false,
    registrationEnabled: true,
    
    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    twoFactorRequired: false,
    
    // Email Settings
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    emailFrom: "noreply@certificatemanager.com",
    
    // Notification Settings
    emailNotifications: true,
    storageWarnings: true,
    systemAlerts: true,
    
    // Performance Settings
    cacheEnabled: true,
    logLevel: "info",
    maxFileSize: 50,
    
    // Integration Settings
    webhookUrl: "",
    apiRateLimit: 1000,
    backupFrequency: "daily"
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurações Avançadas</h1>
            <p className="text-muted-foreground">
              Configure aspectos avançados do sistema, segurança e integrações
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Configurações
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar Configurações
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações Gerais
                  </CardTitle>
                  <CardDescription>
                    Configurações básicas do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="systemName">Nome do Sistema</Label>
                    <Input
                      id="systemName"
                      value={settings.systemName}
                      onChange={(e) => updateSetting('systemName', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="systemDescription">Descrição</Label>
                    <Textarea
                      id="systemDescription"
                      value={settings.systemDescription}
                      onChange={(e) => updateSetting('systemDescription', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
                      <p className="text-sm text-muted-foreground">
                        Bloquear acesso de usuários durante manutenção
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registrationEnabled">Registro Habilitado</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir novos registros de usuários
                      </p>
                    </div>
                    <Switch
                      id="registrationEnabled"
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) => updateSetting('registrationEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Status do Sistema
                  </CardTitle>
                  <CardDescription>
                    Informações sobre o status atual
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status Geral</span>
                    <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm">15 dias, 8 horas</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Versão</span>
                    <Badge variant="outline">v2.1.0</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Último Backup</span>
                    <span className="text-sm">Há 2 horas</span>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    Ver Logs do Sistema
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Segurança de Autenticação
                  </CardTitle>
                  <CardDescription>
                    Configurações de segurança para login e sessões
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxLoginAttempts">Máx. Tentativas de Login</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="passwordExpiry">Expiração de Senha (dias)</Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      value={settings.passwordExpiry}
                      onChange={(e) => updateSetting('passwordExpiry', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactorRequired">2FA Obrigatório</Label>
                      <p className="text-sm text-muted-foreground">
                        Exigir autenticação de dois fatores
                      </p>
                    </div>
                    <Switch
                      id="twoFactorRequired"
                      checked={settings.twoFactorRequired}
                      onCheckedChange={(checked) => updateSetting('twoFactorRequired', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Configurações de API
                  </CardTitle>
                  <CardDescription>
                    Segurança e limites da API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apiRateLimit">Limite de Taxa (req/hora)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      value={settings.apiRateLimit}
                      onChange={(e) => updateSetting('apiRateLimit', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chaves de API Ativas</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-mono">ak_live_...</span>
                        <Badge>Ativa</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-mono">ak_test_...</span>
                        <Badge variant="outline">Teste</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Gerar Nova Chave
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <RolePermissionsManager />
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configurações de Email
                  </CardTitle>
                  <CardDescription>
                    Configure SMTP para envio de emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="smtpHost">Servidor SMTP</Label>
                      <Input
                        id="smtpHost"
                        value={settings.smtpHost}
                        onChange={(e) => updateSetting('smtpHost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">Porta</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.smtpPort}
                        onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="smtpUser">Usuário SMTP</Label>
                    <Input
                      id="smtpUser"
                      value={settings.smtpUser}
                      onChange={(e) => updateSetting('smtpUser', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="smtpPassword">Senha SMTP</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.smtpPassword}
                      onChange={(e) => updateSetting('smtpPassword', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emailFrom">Email Remetente</Label>
                    <Input
                      id="emailFrom"
                      type="email"
                      value={settings.emailFrom}
                      onChange={(e) => updateSetting('emailFrom', e.target.value)}
                    />
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Testar Configuração
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>
                    Configure quais eventos devem gerar notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar alertas importantes por email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="storageWarnings">Avisos de Armazenamento</Label>
                      <p className="text-sm text-muted-foreground">
                        Alertar quando limites se aproximam
                      </p>
                    </div>
                    <Switch
                      id="storageWarnings"
                      checked={settings.storageWarnings}
                      onCheckedChange={(checked) => updateSetting('storageWarnings', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemAlerts">Alertas de Sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações de status e erros
                      </p>
                    </div>
                    <Switch
                      id="systemAlerts"
                      checked={settings.systemAlerts}
                      onCheckedChange={(checked) => updateSetting('systemAlerts', checked)}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Label>Histórico de Notificações</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      <div className="text-sm p-2 bg-muted rounded">
                        <span className="font-medium">Sistema:</span> Backup realizado com sucesso
                        <div className="text-xs text-muted-foreground">Há 2 horas</div>
                      </div>
                      <div className="text-sm p-2 bg-muted rounded">
                        <span className="font-medium">Armazenamento:</span> Tenant ABC próximo ao limite
                        <div className="text-xs text-muted-foreground">Há 4 horas</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks e Integrações
                </CardTitle>
                <CardDescription>
                  Configure integrações com sistemas externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://seu-sistema.com/webhook"
                    value={settings.webhookUrl}
                    onChange={(e) => updateSetting('webhookUrl', e.target.value)}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Eventos para Webhook</Label>
                    <div className="mt-2 space-y-2">
                      {[
                        'Novo tenant criado',
                        'Plano alterado',
                        'Limite de armazenamento atingido',
                        'Erro de sistema'
                      ].map((event, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="checkbox" id={`event-${index}`} className="rounded" />
                          <Label htmlFor={`event-${index}`} className="text-sm">
                            {event}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Integrações Disponíveis</Label>
                    <div className="mt-2 space-y-2">
                      {[
                        { name: 'Slack', status: 'Disponível' },
                        { name: 'Microsoft Teams', status: 'Disponível' },
                        { name: 'Discord', status: 'Em breve' },
                        { name: 'Zapier', status: 'Em breve' }
                      ].map((integration, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{integration.name}</span>
                          <Badge variant={integration.status === 'Disponível' ? 'default' : 'outline'}>
                            {integration.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Webhook className="h-4 w-4 mr-2" />
                  Testar Webhook
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Performance e Cache
                  </CardTitle>
                  <CardDescription>
                    Otimize a performance do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cacheEnabled">Cache Habilitado</Label>
                      <p className="text-sm text-muted-foreground">
                        Usar cache para melhorar performance
                      </p>
                    </div>
                    <Switch
                      id="cacheEnabled"
                      checked={settings.cacheEnabled}
                      onCheckedChange={(checked) => updateSetting('cacheEnabled', checked)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxFileSize">Tamanho Máx. de Arquivo (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="logLevel">Nível de Log</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={settings.logLevel}
                      onChange={(e) => updateSetting('logLevel', e.target.value)}
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar Cache
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backup e Manutenção
                  </CardTitle>
                  <CardDescription>
                    Configure backups automáticos e manutenção
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="backupFrequency">Frequência de Backup</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={settings.backupFrequency}
                      onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                    >
                      <option value="hourly">A cada hora</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Backups Recentes</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">backup_2024_01_15.sql</span>
                        <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">backup_2024_01_14.sql</span>
                        <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Executar Backup Manual
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Otimizar Banco de Dados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}