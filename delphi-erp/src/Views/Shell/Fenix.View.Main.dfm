object FrmMain: TFrmMain
  Left = 0
  Top = 0
  Caption = 'Fenix ERP'
  ClientHeight = 720
  ClientWidth = 1280
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Segoe UI'
  Font.Style = []
  Position = poScreenCenter
  WindowState = wsMaximized
  OnCreate = FormCreate
  TextHeight = 13
  object PnlSidebar: TPanel
    Align = alLeft
    Width = 240
    BevelOuter = bvNone
    ParentBackground = False
    TabOrder = 0
    object LblAppTitle: TLabel
      Left = 24
      Top = 24
      Width = 93
      Height = 28
      Caption = 'Fenix ERP'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -21
      Font.Name = 'Segoe UI Semibold'
      Font.Style = []
      ParentFont = False
    end
    object BtnDashboard: TButton
      Left = 24
      Top = 88
      Width = 192
      Height = 36
      Caption = 'Dashboard'
      TabOrder = 0
    end
    object BtnClientes: TButton
      Left = 24
      Top = 132
      Width = 192
      Height = 36
      Caption = 'Clientes'
      TabOrder = 1
      OnClick = BtnClientesClick
    end
    object BtnOrdensServico: TButton
      Left = 24
      Top = 176
      Width = 192
      Height = 36
      Caption = 'Ordens de Servico'
      TabOrder = 2
    end
    object BtnFinanceiro: TButton
      Left = 24
      Top = 220
      Width = 192
      Height = 36
      Caption = 'Financeiro'
      TabOrder = 3
    end
    object BtnEstoque: TButton
      Left = 24
      Top = 264
      Width = 192
      Height = 36
      Caption = 'Estoque'
      TabOrder = 4
    end
    object BtnVendas: TButton
      Left = 24
      Top = 308
      Width = 192
      Height = 36
      Caption = 'Vendas'
      TabOrder = 5
    end
  end
  object PnlHeader: TPanel
    Align = alTop
    Left = 240
    Top = 0
    Height = 64
    BevelOuter = bvNone
    ParentBackground = False
    TabOrder = 1
    object LblWelcome: TLabel
      Left = 24
      Top = 21
      Width = 156
      Height = 21
      Caption = 'Painel principal do ERP'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -16
      Font.Name = 'Segoe UI Semibold'
      Font.Style = []
      ParentFont = False
    end
  end
  object PnlContent: TPanel
    Align = alClient
    Left = 240
    Top = 64
    BevelOuter = bvNone
    ParentBackground = False
    TabOrder = 2
  end
end
