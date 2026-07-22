object FrmLogin: TFrmLogin
  Left = 0
  Top = 0
  BorderStyle = bsDialog
  Caption = 'Fenix ERP - Login'
  ClientHeight = 430
  ClientWidth = 480
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
  object PnlContainer: TPanel
    Left = 56
    Top = 24
    Width = 369
    Height = 360
    BevelOuter = bvNone
    ParentBackground = False
    TabOrder = 0
    object LblTitle: TLabel
      Left = 32
      Top = 24
      Width = 198
      Height = 28
      Caption = 'Acesso ao Fenix ERP'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -21
      Font.Name = 'Segoe UI Semibold'
      Font.Style = []
      ParentFont = False
    end
    object EdtLogin: TEdit
      Left = 32
      Top = 80
      Width = 305
      Height = 25
      TabOrder = 0
      TextHint = 'Login'
    end
    object EdtPassword: TEdit
      Left = 32
      Top = 120
      Width = 305
      Height = 25
      TabOrder = 1
      TextHint = 'Senha'
    end
    object BtnLogin: TButton
      Left = 32
      Top = 168
      Width = 305
      Height = 33
      Caption = 'Entrar'
      TabOrder = 2
      OnClick = BtnLoginClick
    end
    object LblBootstrapTitle: TLabel
      Left = 32
      Top = 72
      Width = 156
      Height = 15
      Caption = 'Criar administrador inicial'
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clWhite
      Font.Height = -12
      Font.Name = 'Segoe UI Semibold'
      Font.Style = []
      ParentFont = False
    end
    object EdtAdminName: TEdit
      Left = 32
      Top = 96
      Width = 305
      Height = 25
      TabOrder = 3
      TextHint = 'Nome do administrador'
    end
    object EdtAdminLogin: TEdit
      Left = 32
      Top = 127
      Width = 305
      Height = 25
      TabOrder = 4
      TextHint = 'Login'
    end
    object EdtAdminPassword: TEdit
      Left = 32
      Top = 158
      Width = 305
      Height = 25
      TabOrder = 5
      TextHint = 'Senha inicial'
    end
    object EdtAdminEmail: TEdit
      Left = 32
      Top = 189
      Width = 305
      Height = 25
      TabOrder = 6
      TextHint = 'E-mail'
    end
    object BtnCreateAdmin: TButton
      Left = 32
      Top = 220
      Width = 305
      Height = 33
      Caption = 'Criar Administrador'
      TabOrder = 7
      OnClick = BtnCreateAdminClick
    end
    object LblStatus: TLabel
      Left = 32
      Top = 264
      Width = 0
      Height = 15
      Font.Charset = DEFAULT_CHARSET
      Font.Color = clRed
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = []
      ParentFont = False
    end
  end
end
