object DMConnection: TDMConnection
  Height = 240
  Width = 320
  object FDConnection: TFDConnection
    LoginPrompt = False
    Left = 56
    Top = 32
  end
  object FDPhysPgDriverLink: TFDPhysPgDriverLink
    Left = 56
    Top = 96
  end
  object FDGUIxWaitCursor: TFDGUIxWaitCursor
    Provider = 'Forms'
    Left = 56
    Top = 160
  end
end
