object FrmCustomers: TFrmCustomers
  Left = 0
  Top = 0
  Caption = 'Clientes'
  ClientHeight = 680
  ClientWidth = 1100
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Segoe UI'
  Font.Style = []
  Position = poScreenCenter
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  TextHeight = 13
  object PnlTop: TPanel
    Align = alTop
    Height = 64
    BevelOuter = bvNone
    ParentBackground = False
    TabOrder = 0
    object LblTitle: TLabel
      Left = 24
      Top = 20
      Width = 144
      Height = 28
      Caption = 'Cadastro de Clientes'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -21
      Font.Name = 'Segoe UI Semibold'
      Font.Style = []
      ParentFont = False
    end
    object BtnRefresh: TButton
      Left = 936
      Top = 18
      Width = 140
      Height = 32
      Caption = 'Atualizar'
      TabOrder = 0
      OnClick = BtnRefreshClick
    end
  end
  object PnlGrid: TPanel
    Align = alLeft
    Width = 560
    BevelOuter = bvNone
    ParentBackground = False
    TabOrder = 1
    object GridCustomers: TDBGrid
      Align = alClient
      DataSource = DsCustomers
      TabOrder = 0
      OnCellClick = GridCustomersCellClick
    end
  end
  object PnlForm: TPanel
    Align = alClient
    BevelOuter = bvNone
    ParentBackground = False
    TabOrder = 2
    object LblName: TLabel
      Left = 24
      Top = 24
      Width = 33
      Height = 15
      Caption = 'Nome'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblDocument: TLabel
      Left = 24
      Top = 80
      Width = 63
      Height = 15
      Caption = 'CPF / CNPJ'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblPhone: TLabel
      Left = 24
      Top = 136
      Width = 46
      Height = 15
      Caption = 'Telefone'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblWhatsapp: TLabel
      Left = 252
      Top = 136
      Width = 55
      Height = 15
      Caption = 'WhatsApp'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblEmail: TLabel
      Left = 24
      Top = 192
      Width = 31
      Height = 15
      Caption = 'E-mail'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblAddress: TLabel
      Left = 24
      Top = 248
      Width = 53
      Height = 15
      Caption = 'Endereco'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblCity: TLabel
      Left = 24
      Top = 304
      Width = 32
      Height = 15
      Caption = 'Cidade'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblState: TLabel
      Left = 356
      Top = 304
      Width = 14
      Height = 15
      Caption = 'UF'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblNotes: TLabel
      Left = 24
      Top = 360
      Width = 68
      Height = 15
      Caption = 'Observacoes'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object LblStatus: TLabel
      Left = 24
      Top = 608
      Width = 0
      Height = 15
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
    object EdtName: TEdit
      Left = 24
      Top = 45
      Width = 480
      Height = 25
      TabOrder = 0
    end
    object EdtDocument: TEdit
      Left = 24
      Top = 101
      Width = 220
      Height = 25
      TabOrder = 1
    end
    object EdtPhone: TEdit
      Left = 24
      Top = 157
      Width = 200
      Height = 25
      TabOrder = 2
    end
    object EdtWhatsapp: TEdit
      Left = 252
      Top = 157
      Width = 252
      Height = 25
      TabOrder = 3
    end
    object EdtEmail: TEdit
      Left = 24
      Top = 213
      Width = 480
      Height = 25
      TabOrder = 4
    end
    object EdtAddress: TEdit
      Left = 24
      Top = 269
      Width = 480
      Height = 25
      TabOrder = 5
    end
    object EdtCity: TEdit
      Left = 24
      Top = 325
      Width = 300
      Height = 25
      TabOrder = 6
    end
    object EdtState: TEdit
      Left = 356
      Top = 325
      Width = 60
      Height = 25
      CharCase = ecUpperCase
      MaxLength = 2
      TabOrder = 7
    end
    object MemoNotes: TMemo
      Left = 24
      Top = 381
      Width = 480
      Height = 160
      TabOrder = 8
    end
    object BtnNew: TButton
      Left = 24
      Top = 560
      Width = 100
      Height = 32
      Caption = 'Novo'
      TabOrder = 9
      OnClick = BtnNewClick
    end
    object BtnSave: TButton
      Left = 132
      Top = 560
      Width = 100
      Height = 32
      Caption = 'Salvar'
      TabOrder = 10
      OnClick = BtnSaveClick
    end
    object BtnDelete: TButton
      Left = 240
      Top = 560
      Width = 100
      Height = 32
      Caption = 'Excluir'
      TabOrder = 11
      OnClick = BtnDeleteClick
    end
  end
  object DsCustomers: TDataSource
    Left = 856
    Top = 96
  end
end
